import {lazy} from 'react';
export {default as HomeScreen} from './HomeScreen';
export const SalesPerformanceScreen=lazy(()=>import('./SalesPerformanceScreen'));
export const SalesTrendsScreen=lazy(()=>import('./SalesTrendsScreen'));
export const ProductsMenuScreen=lazy(()=>import('./ProductsMenuScreen'));
export const DailyTransactionsScreen=lazy(()=>import('./DailyTransactionsScreen'));
export const PeakOffPeakScreen=lazy(()=>import('./PeakOffPeakScreen'));
export const ReportsScreen=lazy(()=>import('./ReportsScreen'));
