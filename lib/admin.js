export const ADMIN_EMAILS = ['kaban.vershinin@gmail.com', 'didig.vershinin@yandex.ru'];

export function isAdminEmail(email) {
    return !!email && ADMIN_EMAILS.some((item) => item.toLowerCase() === String(email).toLowerCase());
}

export function isAdminUser(user) {
    return isAdminEmail(user?.email);
}
