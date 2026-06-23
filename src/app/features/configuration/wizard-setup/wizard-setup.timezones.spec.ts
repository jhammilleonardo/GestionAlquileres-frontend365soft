import { COUNTRY_TIMEZONES } from './wizard-setup.component';

describe('wizard setup timezones', () => {
  it('incluye todas las zonas operativas de Estados Unidos', () => {
    expect(COUNTRY_TIMEZONES['US'].map((timezone) => timezone.value)).toEqual([
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Phoenix',
      'America/Los_Angeles',
      'America/Anchorage',
      'America/Adak',
      'Pacific/Honolulu',
      'America/Puerto_Rico',
      'Pacific/Pago_Pago',
      'Pacific/Guam',
    ]);
  });

  it('usa identificadores IANA válidos y sin duplicados', () => {
    const values = Object.values(COUNTRY_TIMEZONES)
      .flat()
      .map((timezone) => timezone.value);

    expect(new Set(values).size).toBe(values.length);
    for (const value of values) {
      expect(() => new Intl.DateTimeFormat('es', { timeZone: value })).not.toThrow();
    }
  });
});
