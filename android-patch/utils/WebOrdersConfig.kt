package com.example.utils

/**
 * إعدادات ربط تطبيق الكاشير بصفحة الويب (Lovable Cloud).
 *
 * WEB_BASE_URL  : رابط صفحة الطلبات الجميلة اللي بيفتحها الزبون بعد ما يمسح الـ QR.
 * POS_TOKEN     : كلمة سر مشتركة بين التطبيق والسيرفر (نفس قيمة السر POS_ACCESS_TOKEN على الويب).
 *                 لا تنشرها ولا تشاركها مع الزبائن.
 */
object WebOrdersConfig {
    // بعد نشر الموقع استخدم رابط الإنتاج الثابت:
    const val WEB_BASE_URL = "https://project--5d4a9f41-afac-4502-ba79-78ae7e23d10e.lovable.app"

    // للتجربة قبل النشر:
    // const val WEB_BASE_URL = "https://project--5d4a9f41-afac-4502-ba79-78ae7e23d10e-dev.lovable.app"

    const val ORDERS_ENDPOINT = "$WEB_BASE_URL/api/public/pos/orders"

    // ⚠️ ضع هنا نفس القيمة اللي حفظتها في أسرار الويب باسم POS_ACCESS_TOKEN
    const val POS_TOKEN = "REPLACE_WITH_YOUR_POS_ACCESS_TOKEN"
}
