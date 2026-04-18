// Define a type for the colors object
interface ColorPalette {
  readonly primary: string;
  readonly secondary: string;
  readonly border: string;
  readonly tinyGrey: string;
  readonly backGroundGrey: string;
  readonly tertiary: string;
  readonly success: string;
  readonly darkBlue: string;
}

// Create a read-only color palette
export const COLORS: Readonly<ColorPalette> = {
  primary: '#003462',
  secondary: '#b2ebf2',
  border: '#FEEAF1',
  tinyGrey: '#FDFDFD',
  backGroundGrey: '#F5F6F7',
  tertiary: '#6C4DDA',
  success: '#0ABE75',
  darkBlue: '#2A629A',
} as const;