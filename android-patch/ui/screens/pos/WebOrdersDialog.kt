package com.example.ui.screens.pos

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Language
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.data.repository.WebOrder

/** أيقونة في الشريط العلوي للـ POS تعرض عدد طلبات الويب الجديدة. */
@Composable
fun WebOrdersBadgeButton(count: Int, onClick: () -> Unit) {
    BadgedBox(badge = { if (count > 0) Badge { Text("$count") } }) {
        IconButton(onClick = onClick) {
            Icon(Icons.Default.Language, contentDescription = "طلبات الويب")
        }
    }
}

@Composable
fun WebOrdersDialog(
    orders: List<WebOrder>,
    isLoading: Boolean,
    onRefresh: () -> Unit,
    onAccept: (WebOrder) -> Unit,
    onReject: (WebOrder) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("طلبات الويب الجديدة", fontWeight = FontWeight.Bold)
                TextButton(onClick = onRefresh, enabled = !isLoading) { Text("تحديث") }
            }
        },
        text = {
            if (orders.isEmpty()) {
                Text(if (isLoading) "جارٍ التحميل..." else "لا توجد طلبات جديدة")
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(orders) { order ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("طلب ${order.code}", fontWeight = FontWeight.Bold)
                                order.qrTitle?.let {
                                    Text(it, style = MaterialTheme.typography.bodySmall)
                                }
                                order.customerName?.let {
                                    Text(
                                        "الزبون: $it ${order.customerPhone ?: ""}",
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                                Spacer(Modifier.height(6.dp))
                                order.items.forEach { item ->
                                    Text("${item.quantity} × ${item.name}")
                                }
                                Spacer(Modifier.height(6.dp))
                                Text(
                                    "الإجمالي: ${order.total} ج.م — ${order.paymentMethod}",
                                    fontWeight = FontWeight.Bold
                                )
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Button(onClick = { onAccept(order) }) { Text("استقبال في السلة") }
                                    OutlinedButton(onClick = { onReject(order) }) { Text("رفض") }
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("إغلاق") } }
    )
}
