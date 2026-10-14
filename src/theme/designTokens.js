import {createContext} from 'react';

export const layoutWidthContext = createContext(null);
export const tokens = {
  space: {icon: 8, control: 12, card: 16, section: 24},
  type: {page: 28, pageMobile: 24, section: 18, body: 14, table: 13, supporting: 12, axis: 11, kpi: 24},
  radius: {control: 6, card: 10},
  size: {button: 44, sidebar: 232, header: 68, contentMax: 2080},
};
export const contentPadding = width => width < 680 ? 12 : width < 1440 ? 20 : 24;
