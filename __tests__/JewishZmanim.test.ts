// /**
//  * Tests for Hebrew Calendar utility functions
//  */

// import hebcalService from '../src/utilities/HebcalService';

// describe('HebcalService', () => {
//   // Save original Date constructor
//   const OriginalDate = Date;

//   afterEach(() => {
//     // Restore original Date after each test
//     global.Date = OriginalDate as DateConstructor;
//   });

//   describe('getStandardZmanim', () => {
//     it('should return zmanim data with proper structure', () => {
//       // Run the function
//       const result = hebcalService.getStandardZmanim();

//       // Verify basic structure
//       expect(result).toBeDefined();
//       expect(result.HebrewDate).toBeDefined();
//       expect(result.SunRise).toBeDefined();
//       expect(result.SunSet).toBeDefined();
//       expect(typeof result.SunRise).toBe('string');
//       expect(typeof result.SunSet).toBe('string');
//       expect(typeof result.HebrewDate).toBe('string');
//       expect(result.Method).toContain('חזון שמים');
//     });

//     it('should use the right date when provided', () => {
//       // Use a fixed date
//       const mockDate = new Date('2025-04-17T10:00:00');

//       // Run function with specific date
//       const result = hebcalService.getStandardZmanim(mockDate);

//       // Verify date is as expected (April 17)
//       expect(result.Date).toContain('17/04/2025');
//     });

//     it('should work with custom city', () => {
//       // Create a Jerusalem service
//       const jerusalemService = new hebcalService.constructor({city: 'Jerusalem'});

//       // Get zmanim for Jerusalem
//       const result = jerusalemService.getStandardZmanim();

//       // Should return data for Jerusalem
//       expect(result).toBeDefined();
//       expect(result.HebrewDate).toBeDefined();
//       expect(result.Place).toBe('Jerusalem');
//       expect(result.SunRise).toBeDefined();
//       expect(result.SunSet).toBeDefined();
//     });

//     it('should handle relative hour calculation', () => {
//       const result = hebcalService.getStandardZmanim();

//       // Relative hour should be a number representing minutes
//       expect(result.RelativeHour).toBeDefined();
//       expect(typeof result.RelativeHour).toBe('number');
//     });
//   });
// });
