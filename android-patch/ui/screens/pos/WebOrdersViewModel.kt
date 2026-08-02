package com.example.ui.screens.pos

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.repository.WebOrder
import com.example.data.repository.WebOrdersRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * يعمل Polling كل 10 ثواني على طلبات الويب الجديدة ويعرضها للكاشير.
 */
class WebOrdersViewModel : ViewModel() {

    private val _orders = MutableStateFlow<List<WebOrder>>(emptyList())
    val orders: StateFlow<List<WebOrder>> = _orders.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        viewModelScope.launch {
            while (true) {
                refresh()
                delay(10_000)
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            _isLoading.value = true
            _orders.value = WebOrdersRepository.fetchOrders("new")
            _isLoading.value = false
        }
    }

    /** يستقبل الطلب: يضيفه لسلة الكاشير ويعلّمه "accepted" على السيرفر. */
    fun acceptOrder(order: WebOrder, posViewModel: PosViewModel) {
        order.items.forEach { item ->
            val product = Product(
                id = item.id,
                name = item.name,
                price = item.price,
                category = "طلبات الويب"
            )
            repeat(item.quantity) { posViewModel.addToCart(product) }
        }
        viewModelScope.launch {
            WebOrdersRepository.updateStatus(order.id, "accepted")
            refresh()
        }
    }

    fun rejectOrder(order: WebOrder) {
        viewModelScope.launch {
            WebOrdersRepository.updateStatus(order.id, "rejected")
            refresh()
        }
    }
}
