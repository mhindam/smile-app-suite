# ربط تطبيق الأندرويد (APK) بصفحة الويب

ملفات جاهزة تنسخها في مشروع الأندرويد (`coffee-pos`) ثم تعمل Build → APK من Android Studio.
لوفابل بيبني ويستضيف تطبيقات ويب فقط، فمش بيقدر يطلّع ملف APK — لكن الكود ده بيعمل الربط بالكامل.

## 1) نسخ الملفات

| الملف هنا | مكانه في مشروع الأندرويد |
| --- | --- |
| `utils/WebOrdersConfig.kt` | `app/src/main/java/com/example/utils/` |
| `data/repository/WebOrdersRepository.kt` | `app/src/main/java/com/example/data/repository/` |
| `ui/screens/pos/WebOrdersViewModel.kt` | `app/src/main/java/com/example/ui/screens/pos/` |
| `ui/screens/pos/WebOrdersDialog.kt` | `app/src/main/java/com/example/ui/screens/pos/` |
| `ui/screens/settings/sections/CustomerOrderSettingsSection.kt` | يستبدل الملف الموجود بنفس الاسم |

## 2) الإعدادات

في `WebOrdersConfig.kt`:
- `WEB_BASE_URL` = رابط الموقع بعد النشر.
- `POS_TOKEN` = نفس قيمة السر `POS_ACCESS_TOKEN` المحفوظة في أسرار مشروع الويب.

## 3) ربط شاشة الـ POS

في `PosScreen.kt` أضف:

```kotlin
val webOrdersViewModel: WebOrdersViewModel = viewModel()
val webOrders by webOrdersViewModel.orders.collectAsState()
val webLoading by webOrdersViewModel.isLoading.collectAsState()
var showWebOrders by remember { mutableStateOf(false) }
```

في `actions` بتاعة الـ TopAppBar (جنب أيقونة الباركود):

```kotlin
WebOrdersBadgeButton(count = webOrders.size) { showWebOrders = true }
```

وفي آخر الـ Composable:

```kotlin
if (showWebOrders) {
    WebOrdersDialog(
        orders = webOrders,
        isLoading = webLoading,
        onRefresh = { webOrdersViewModel.refresh() },
        onAccept = { webOrdersViewModel.acceptOrder(it, viewModel) },
        onReject = { webOrdersViewModel.rejectOrder(it) },
        onDismiss = { showWebOrders = false }
    )
}
```

(`viewModel` هنا هو الـ `PosViewModel` المستخدم في الشاشة.)

## 4) الصلاحيات

اتأكد إن `AndroidManifest.xml` فيه:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

## 5) البناء

Android Studio → Build → Build Bundle(s)/APK(s) → Build APK(s).

## كيف يشتغل النظام

1. الكاشير: الإعدادات → إنشاء رمز QR (طاولة 5 مثلاً) → يطبعه أو يشاركه.
2. الزبون يمسح الرمز → تفتح له صفحة الويب بنفس تصميم الـ POS، مع اسم الطاولة والرسالة.
3. يختار المنتجات ويأكد الدفع → الطلب يتخزن في Lovable Cloud.
4. تطبيق الكاشير بيسأل السيرفر كل 10 ثواني → الطلب يظهر في أيقونة "طلبات الويب" مع عدّاد.
5. الكاشير يضغط "استقبال في السلة" → الأصناف تتحط في سلة الـ POS ويتم الدفع عادي.
