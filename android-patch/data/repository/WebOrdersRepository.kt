package com.example.data.repository

import com.example.utils.WebOrdersConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL

data class WebOrderItem(
    val id: Int,
    val name: String,
    val price: Double,
    val quantity: Int
)

data class WebOrder(
    val id: String,
    val code: String,
    val qrTitle: String?,
    val qrMessage: String?,
    val customerName: String?,
    val customerPhone: String?,
    val total: Double,
    val paymentMethod: String,
    val status: String,
    val createdAt: String,
    val items: List<WebOrderItem>
)

/**
 * يقرأ الطلبات القادمة من صفحة الويب (اللي الزبون فتحها بالـ QR)
 * ويحدّث حالتها بعد ما الكاشير يستقبلها.
 */
object WebOrdersRepository {

    suspend fun fetchOrders(status: String = "new", limit: Int = 50): List<WebOrder> =
        withContext(Dispatchers.IO) {
            val url = URL("${WebOrdersConfig.ORDERS_ENDPOINT}?status=$status&limit=$limit")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                setRequestProperty("x-pos-token", WebOrdersConfig.POS_TOKEN)
                connectTimeout = 10_000
                readTimeout = 10_000
            }
            try {
                if (conn.responseCode != 200) return@withContext emptyList()
                val body = conn.inputStream.bufferedReader().use(BufferedReader::readText)
                parseOrders(JSONObject(body).optJSONArray("orders"))
            } catch (e: Exception) {
                e.printStackTrace()
                emptyList()
            } finally {
                conn.disconnect()
            }
        }

    suspend fun updateStatus(orderId: String, status: String): Boolean =
        withContext(Dispatchers.IO) {
            val conn = (URL(WebOrdersConfig.ORDERS_ENDPOINT).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("x-pos-token", WebOrdersConfig.POS_TOKEN)
                connectTimeout = 10_000
                readTimeout = 10_000
            }
            try {
                val payload = JSONObject().put("id", orderId).put("status", status).toString()
                conn.outputStream.use { it.write(payload.toByteArray()) }
                conn.responseCode == 200
            } catch (e: Exception) {
                e.printStackTrace()
                false
            } finally {
                conn.disconnect()
            }
        }

    private fun parseOrders(array: JSONArray?): List<WebOrder> {
        if (array == null) return emptyList()
        return (0 until array.length()).map { i ->
            val o = array.getJSONObject(i)
            val itemsArray = o.optJSONArray("items") ?: JSONArray()
            WebOrder(
                id = o.getString("id"),
                code = o.optString("code"),
                qrTitle = o.optString("qr_title").takeIf { it.isNotBlank() && it != "null" },
                qrMessage = o.optString("qr_message").takeIf { it.isNotBlank() && it != "null" },
                customerName = o.optString("customer_name").takeIf { it.isNotBlank() && it != "null" },
                customerPhone = o.optString("customer_phone").takeIf { it.isNotBlank() && it != "null" },
                total = o.optDouble("total", 0.0),
                paymentMethod = o.optString("payment_method", "cash"),
                status = o.optString("status", "new"),
                createdAt = o.optString("created_at"),
                items = (0 until itemsArray.length()).map { j ->
                    val it = itemsArray.getJSONObject(j)
                    WebOrderItem(
                        id = it.optInt("id"),
                        name = it.optString("name"),
                        price = it.optDouble("price", 0.0),
                        quantity = it.optInt("quantity", 1)
                    )
                }
            )
        }
    }
}
