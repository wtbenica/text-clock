import { Color } from "../../models/color.js";

export interface StylePresentation {
  timeStyle: string;
  dividerStyle: string;
  dateStyle: string;
}

export function buildStyles(
  clockColor: Color,
  dateColor: Color,
  dividerColor: Color,
): StylePresentation {
  return {
    timeStyle: `color: ${clockColor.toString()};`,
    dateStyle: `color: ${dateColor.toString()};`,
    dividerStyle: `color: ${dividerColor.toString()}; font-weight: bold;`,
  };
}

export default buildStyles;
