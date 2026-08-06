/**
 * الحصول على التاريخ الهجري بصيغة منسقة
 */
export const getHijriDate = (): string => {
  const date = new Date();
  
  // التقويم الهجري للمملكة العربية السعودية
  const hijriOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  try {
    const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', hijriOptions)
      .format(date);
    return hijriDate.replace(/هـ/gi, '').trim();
  } catch (e) {
    // Fallback if UMALQURA is not supported
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', hijriOptions).format(date).replace(/هـ/gi, '').trim();
  }
};

/**
 * الحصول على التاريخ الميلادي بصيغة منسقة
 */
export const getGregorianDate = (): string => {
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat('ar-SA', options).format(date);
};

/**
 * الحصول على اليوم باللغة العربية
 */
export const getDayName = (): string => {
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long'
  };
  
  return new Intl.DateTimeFormat('ar-SA', options).format(date);
};

/**
 * الحصول على التاريخ الكامل (اليوم - الهجري - الميلادي)
 */
export const getFullDate = (): { day: string; hijri: string; gregorian: string } => {
  return {
    day: getDayName(),
    hijri: getHijriDate(),
    gregorian: getGregorianDate()
  };
};
