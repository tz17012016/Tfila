/**
 * בדיקות עבור רכיב הזמנים
 *
 * @jest-environment jsdom
 */

import {render, screen} from '@testing-library/react-native';
import React from 'react';
import {Provider} from 'react-redux';
import configureStore from 'redux-mock-store';
import Zmanim from '../src/components/Zmanim';
import * as Dates from '../src/utilities/Dates';

// יוצרים חנות מדומה לבדיקות
const mockStore = configureStore([]);

// מדמים את הפונקציות מספרית התאריכים
jest.mock('../src/utilities/Dates', () => ({
  convertToHebrewDate: jest.fn(() => 'ט"ו בניסן תשפ"ה'),
  getJewishEvents: jest.fn(() => [
    {
      render: jest.fn(() => 'פסח'),
    },
  ]),
  isShabbatOrHoliday: jest.fn(() => false),
}));

// מדמים את הפונקציות מ-timeUtils
jest.mock('../src/utilities/timeUtils', () => ({
  formatTimeForDisplay: jest.fn(time => time),
  parseTimeString: jest.fn(timeStr => new Date(`2025-04-14T${timeStr}:00`)),
}));

describe('רכיב Zmanim', () => {
  let store: any;

  beforeEach(() => {
    // מאפס את המצב המדומה לפני כל בדיקה
    store = mockStore({
      cachedDb: {
        dbData: {
          zmanimData: {
            zmanim: [
              {name: 'עלות השחר', time: '05:00'},
              {name: 'זריחה', time: '06:30'},
              {name: 'סוף זמן קריאת שמע', time: '09:15'},
              {name: 'חצות', time: '12:00'},
              {name: 'מנחה גדולה', time: '12:45'},
              {name: 'שקיעה', time: '19:30'},
              {name: 'צאת הכוכבים', time: '20:00'},
            ],
          },
        },
      },
    });

    // קביעת תאריך קבוע לבדיקות
    jest.useFakeTimers().setSystemTime(new Date('2025-04-14T10:30:00'));
  });

  it('מציג את כותרת הרכיב בהצלחה', () => {
    render(
      <Provider store={store}>
        <Zmanim />
      </Provider>,
    );

    expect(screen.getByText('זמני היום')).toBeTruthy();
  });

  it('מציג את התאריך העברי בהצלחה', () => {
    render(
      <Provider store={store}>
        <Zmanim />
      </Provider>,
    );

    expect(screen.getByText('ט"ו בניסן תשפ"ה')).toBeTruthy();
  });

  it('מציג את רשימת הזמנים בהצלחה', () => {
    render(
      <Provider store={store}>
        <Zmanim />
      </Provider>,
    );

    expect(screen.getByText('עלות השחר')).toBeTruthy();
    expect(screen.getByText('זריחה')).toBeTruthy();
    expect(screen.getByText('סוף זמן קריאת שמע')).toBeTruthy();
    expect(screen.getByText('חצות')).toBeTruthy();
    expect(screen.getByText('שקיעה')).toBeTruthy();
  });

  it('מציג את הזמן הקרוב הבא בהצלחה', () => {
    render(
      <Provider store={store}>
        <Zmanim />
      </Provider>,
    );

    expect(screen.getByText('הזמן הקרוב:')).toBeTruthy();
    expect(screen.getByText(/חצות - 12:00/)).toBeTruthy();
  });

  it('לא מציג את תגית שבת ביום חול', () => {
    render(
      <Provider store={store}>
        <Zmanim />
      </Provider>,
    );

    expect(() => screen.getByText('שבת שלום')).toThrow();
  });

  it('מציג את תגית שבת בשבת', () => {
    // מדמה שהיום הוא שבת
    (Dates.isShabbatOrHoliday as jest.Mock).mockReturnValueOnce(true);

    render(
      <Provider store={store}>
        <Zmanim />
      </Provider>,
    );

    expect(screen.getByText('שבת שלום')).toBeTruthy();
  });

  it('מכבד את הגבלת המספר המרבי של זמנים להצגה', () => {
    render(
      <Provider store={store}>
        <Zmanim displayLimit={3} />
      </Provider>,
    );

    expect(screen.getByText('עלות השחר')).toBeTruthy();
    expect(screen.getByText('זריחה')).toBeTruthy();
    expect(screen.getByText('סוף זמן קריאת שמע')).toBeTruthy();
    expect(() => screen.getByText('חצות')).toThrow();
  });

  it('מציג הודעה אם אין נתוני זמנים', () => {
    // מאפס את המצב המדומה ללא נתוני זמנים
    store = mockStore({
      cachedDb: {
        dbData: {
          zmanimData: {},
        },
      },
    });

    render(
      <Provider store={store}>
        <Zmanim />
      </Provider>,
    );

    expect(screen.getByText('אין נתוני זמנים להצגה')).toBeTruthy();
  });
});
