package com.example.ui.screens.settings.sections

import android.graphics.Bitmap
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.utils.QrCodeUtils
import com.example.utils.WebOrdersConfig

/**
 * نسخة معدّلة: الـ QR بقى بيفتح صفحة الويب المنشورة (Lovable) بدل السيرفر المحلي،
 * فالزبون يقدر يطلب من أي مكان وأي شبكة.
 */
@Composable
fun CustomerOrderSettingsSection(
    onGenerateQrCode: (title: String, message: String) -> Unit
) {
    var qrTitle by remember { mutableStateOf("") }
    var qrMessage by remember { mutableStateOf("") }
    var generatedQrCode by remember { mutableStateOf<Bitmap?>(null) }
    var showQrDialog by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                "إنشاء رمز QR للطلبات الخارجية",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                "الزبون يمسح الرمز فتفتح له صفحة الطلب على الإنترنت، والطلب يوصل لشاشة الكاشير.",
                style = MaterialTheme.typography.bodySmall
            )
            Spacer(modifier = Modifier.height(16.dp))
            OutlinedTextField(
                value = qrTitle,
                onValueChange = { qrTitle = it },
                label = { Text("عنوان رمز الاستجابة السريعة (مثل: طاولة 5 أو عنوان الوجهة)") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedTextField(
                value = qrMessage,
                onValueChange = { qrMessage = it },
                label = { Text("الرسالة التوضيحية (مثل: نتشرف بطلبكم)") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = {
                    if (qrTitle.isNotBlank()) {
                        val qrData = WebOrdersConfig.WEB_BASE_URL +
                            "/?title=${Uri.encode(qrTitle)}&msg=${Uri.encode(qrMessage)}"
                        generatedQrCode = QrCodeUtils.generateQrCode(qrData, 600, 600)
                        showQrDialog = true
                    }
                },
                modifier = Modifier.align(Alignment.End)
            ) {
                Text("إنشاء رمز QR")
            }
        }
    }

    if (showQrDialog && generatedQrCode != null) {
        QrCodeDialog(
            bitmap = generatedQrCode!!,
            title = qrTitle,
            message = qrMessage,
            onDismiss = { showQrDialog = false },
            onSimulate = {
                showQrDialog = false
                onGenerateQrCode(qrTitle, qrMessage)
            }
        )
    }
}
