export function pickFaceVerificationLink(result) {
  return (
    result?.ShortUrl ||
    result?.ShortURL ||
    result?.ShortLink ||
    result?.Shortlink ||
    result?.Short ||
    result?.H5Link ||
    ""
  );
}
