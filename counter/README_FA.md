# سامانه مرکزی SAHROUD COUNTER

نسخه اولیه معماری و کد سامانه آمارگیری مرکزی محصولات SAHROUD.

## ساختار

- `index.html`: پنل فارسی مدیریت و گزارش.
- `client.js`: کتابخانه مشترک برای اتصال نرم‌افزارهای وب.
- `worker.js`: API دریافت رویداد و ارائه گزارش.
- `schema.sql`: ساختار پایگاه داده Cloudflare D1.
- `wrangler.toml.example`: نمونه تنظیم استقرار Worker.

## معماری انتخاب‌شده

نرم‌افزارهای GitHub Pages به یک Cloudflare Worker متصل می‌شوند. Worker رویداد را دریافت می‌کند، شهر و کشور را از `request.cf` می‌خواند و در D1 ثبت می‌کند. GitHub Pages فقط میزبان رابط کاربری است و محل مناسبی برای نگهداری کلید محرمانه یا دریافت امن داده نیست.

## حریم خصوصی

1. GPS و مجوز مکان گوشی درخواست نمی‌شود.
2. شهر و کشور از فراداده IP در سمت Worker به دست می‌آید؛ دقت آن تضمین‌شده نیست.
3. IP خام در جدول ذخیره نمی‌شود.
4. شناسه تصادفی مرورگر در سمت سرور با HMAC به شناسه مستعار تبدیل می‌شود.
5. ارسال آمار فقط بعد از انتخاب «موافقم» در پیام رضایت انجام می‌شود.
6. رد آمارگیری نباید هیچ قابلیتی از نرم‌افزار را مسدود کند.
7. شناسه مرورگر برای شمارش کاربران یکتا ذخیره می‌شود؛ بنابراین داده کاملاً بی‌ارتباط با دستگاه نیست و باید در توضیح حریم خصوصی اعلام شود.

## راه‌اندازی سرور

این بخش نیازمند حساب Cloudflare و اجرای دستورات از رایانه یا محیط دارای Node.js است:

1. نصب Wrangler: `npm install -g wrangler`
2. ورود: `wrangler login`
3. ساخت D1: `wrangler d1 create sahroud-counter`
4. قرار دادن شناسه دیتابیس در `wrangler.toml` بر اساس نمونه.
5. اجرای ساختار: `wrangler d1 execute sahroud-counter --file=./schema.sql`
6. ساخت دو کلید محرمانه قوی:
   - `wrangler secret put ADMIN_TOKEN`
   - `wrangler secret put HASH_SECRET`
7. استقرار: `wrangler deploy`
8. آزمایش: بازکردن نشانی Worker با مسیر `/health`.

کلید مدیر را در GitHub یا فایل‌های HTML/JavaScript قرار ندهید.

## اتصال هر نرم‌افزار

پس از استقرار Worker، در HTML هر محصول و پیش از بارگذاری کتابخانه مشترک، این تنظیم را اضافه کنید:

```html
<script>
window.SAHROUD_COUNTER_CONFIG = {
  apiBase: "https://YOUR-WORKER.workers.dev",
  appId: "tasbih",
  appName: "SAHROUD TASBIH",
  version: "1.0"
};
</script>
<script src="https://sahroud.github.io/A/counter/client.js" defer></script>
```

برای محصولات دیگر، `appId` یکتا تعیین شود؛ مانند `utm`، `rtk`، `metreh`، `steel` و `rakat`. این کتابخانه پس از رضایت کاربر رویداد `app_open` را یک بار در هر نشست ثبت می‌کند. رویدادهای اختصاصی را می‌توان با `SAHROUD_COUNTER.track("event_name")` ثبت کرد.

## وضعیت نسخه

کد پایه و پنل آماده میزبانی GitHub Pages است، اما تا زمان ایجاد D1، تنظیم اسرار و استقرار Worker، آمار واقعی جمع‌آوری نمی‌شود. سپس باید کد مشترک در تمام محصولات فعال شود.