import { getReact, getReactNative } from '../metro/common.js';
import { findByProps, waitFor } from '../metro/index.js';

export type VencordIconName =
  | 'nekocordLogo'
  | 'mainSettings'
  | 'cogWheel'
  | 'plugins'
  | 'paintbrush'
  | 'updater'
  | 'backupRestore'
  | 'cloud'
  | 'cloudDownload'
  | 'cloudUpload'
  | 'restart'
  | 'info'
  | 'search'
  | 'delete'
  | 'copy'
  | 'github'
  | 'openExternal'
  | 'starFilled'
  | 'starOutlined'
  | 'safety'
  | 'rightArrow'
  | 'leftArrow'
  | 'link'
  | 'plus'
  | 'folder'
  | 'log'
  | 'clock';

interface SvgPathSpec {
  d: string;
  fill?: string;
  fillRule?: 'evenodd' | 'nonzero';
  clipRule?: 'evenodd' | 'nonzero';
  stroke?: boolean;
  strokeWidth?: number;
  strokeLinecap?: 'round' | 'butt' | 'square';
  strokeLinejoin?: 'round' | 'bevel' | 'miter';
}

interface SvgIconSpec {
  viewBox: string;
  paths: SvgPathSpec[];
}

const COG_WHEEL_PATH =
  'M10.56 1.1c-.46.05-.7.53-.64.98.18 1.16-.19 2.2-.98 2.53-.8.33-1.79-.15-2.49-1.1-.27-.36-.78-.52-1.14-.24-.77.59-1.45 1.27-2.04 2.04-.28.36-.12.87.24 1.14.96.7 1.43 1.7 1.1 2.49-.33.8-1.37 1.16-2.53.98-.45-.07-.93.18-.99.64a11.1 11.1 0 0 0 0 2.88c.06.46.54.7.99.64 1.16-.18 2.2.19 2.53.98.33.8-.14 1.79-1.1 2.49-.36.27-.52.78-.24 1.14.59.77 1.27 1.45 2.04 2.04.36.28.87.12 1.14-.24.7-.95 1.7-1.43 2.49-1.1.8.33 1.16 1.37.98 2.53-.07.45.18.93.64.99a11.1 11.1 0 0 0 2.88 0c.46-.06.7-.54.64-.99-.18-1.16.19-2.2.98-2.53.8-.33 1.79.14 2.49 1.1.27.36.78.52 1.14.24.77-.59 1.45-1.27 2.04-2.04.28-.36.12-.87-.24-1.14-.96-.7-1.43-1.7-1.1-2.49.33-.8 1.37-1.16 2.53-.98.45.07.93-.18.99-.64a11.1 11.1 0 0 0 0-2.88c-.06-.46-.54-.7-.99-.64-1.16.18-2.2-.19-2.53-.98-.33-.8.14-1.79 1.1-2.49.36-.27.52-.78.24-1.14a11.07 11.07 0 0 0-2.04-2.04c-.36-.28-.87-.12-1.14.24-.7.96-1.7 1.43-2.49 1.1-.8-.33-1.16-1.37-.98-2.53.07-.45-.18-.93-.64-.99a11.1 11.1 0 0 0-2.88 0ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z';

const VENCORD_ICONS: Record<VencordIconName, SvgIconSpec> = {
  nekocordLogo: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M5.2 9.2 L4.2 2.4 C4.1 1.7 4.9 1.3 5.5 1.7 L9.8 4.8 C11.2 4.3 12.8 4.3 14.2 4.8 L18.5 1.7 C19.1 1.3 19.9 1.7 19.8 2.4 L18.8 9.2 C20.2 10.6 21 12.6 21 14.8 C21 19.4 17 22 12 22 C7 22 3 19.4 3 14.8 C3 12.6 3.8 10.6 5.2 9.2 Z M8.2 17.5 V10.2 H10.2 L13.8 14.7 V10.2 H15.8 V17.5 H13.8 L10.2 13 V17.5 Z',
        fillRule: 'evenodd',
        clipRule: 'evenodd',
      },
    ],
  },
  mainSettings: {
    viewBox: '0 0 24 24',
    paths: [{ d: COG_WHEEL_PATH, fillRule: 'evenodd', clipRule: 'evenodd' }],
  },
  cogWheel: {
    viewBox: '0 0 24 24',
    paths: [{ d: COG_WHEEL_PATH, fillRule: 'evenodd', clipRule: 'evenodd' }],
  },
  plugins: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M18.559 12.8227C17.7884 13.4957 16.6663 13.3616 15.9404 12.641C14.7975 11.5063 11.4931 8.21104 11.4931 8.21104C10.897 7.63087 10.897 6.44662 11.4931 5.85464C12.319 5.03435 13.6053 3.75146 13.6053 3.75146C13.9641 3.39195 14.456 3.18972 14.9653 3.18886L18.3363 3.18425L19.5255 2L22.5 4.96048L21.3108 6.14473L21.3021 9.50878C21.2992 10.0164 21.0967 10.5026 20.735 10.8613C20.735 10.8613 19.5718 11.9384 18.559 12.8227ZM15.2315 13.9548L13.4954 15.8273C14.0972 16.4265 14.0972 16.9113 13.64 17.6997L11.3976 20.2485C11.0359 20.6081 10.5469 20.8103 10.0347 20.8111L6.66378 20.8158L5.47455 22L2.5 19.0395L3.68927 17.8553L3.70082 14.4912C3.70082 13.9836 3.90338 13.4974 4.26507 13.1387L6.37153 11.0404C6.96759 10.4485 8.15685 10.4485 8.73844 11.0404L8.74424 11.0465L10.5295 9.26998L11.7188 10.4542L9.93347 12.2305L12.3119 14.599L14.0972 12.8227L15.2315 13.9548Z',
      },
    ],
  },
  paintbrush: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M15.35 7.24C15.9 6.67 16 5.8 16 5a3 3 0 1 1 3 3c-.8 0-1.67.09-2.24.65a1.5 1.5 0 0 0 0 2.11l1.12 1.12a3 3 0 0 1 0 4.24l-5 5a3 3 0 0 1-4.25 0l-5.76-5.75a3 3 0 0 1 0-4.24l4.04-4.04.97-.97a3 3 0 0 1 4.24 0l1.12 1.12c.58.58 1.52.58 2.1 0ZM6.9 9.9 4.3 12.54a1 1 0 0 0 0 1.42l2.17 2.17.83-.84a1 1 0 0 1 1.42 1.42l-.84.83.59.59 1.83-1.84a1 1 0 0 1 1.42 1.42l-1.84 1.83.17.17a1 1 0 0 0 1.42 0l2.63-2.62L6.9 9.9Z',
        fillRule: 'evenodd',
        clipRule: 'evenodd',
      },
    ],
  },
  updater: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M12 2C12.2652 2 12.5196 2.10536 12.7071 2.29289C12.8946 2.48043 13 2.73478 13 3V13.59L16.3 10.29C16.3904 10.186 16.5013 10.1018 16.6258 10.0427C16.7503 9.98362 16.8856 9.95088 17.0234 9.94656C17.1611 9.94224 17.2982 9.96644 17.4261 10.0176C17.5541 10.0688 17.6701 10.1459 17.7668 10.244C17.8635 10.3421 17.939 10.4592 17.9883 10.5878C18.0377 10.7165 18.0599 10.8539 18.0537 10.9916C18.0474 11.1292 18.0127 11.2641 17.9519 11.3877C17.891 11.5114 17.8053 11.6211 17.7 11.71L12.7 16.71C12.5131 16.8932 12.2618 16.9959 12 16.9959C11.7382 16.9959 11.4869 16.8932 11.3 16.71L6.3 11.71C6.19474 11.6211 6.10898 11.5114 6.04812 11.3877C5.98726 11.2641 5.95261 11.1292 5.94634 10.9916C5.94007 10.8539 5.96231 10.7165 6.01167 10.5878C6.06104 10.4592 6.13646 10.3421 6.2332 10.244C6.32994 10.1459 6.44592 10.0688 6.57385 10.0176C6.70179 9.96644 6.83892 9.94224 6.97665 9.94656C7.11438 9.95088 7.24972 9.98362 7.3742 10.0427C7.49868 10.1018 7.6096 10.186 7.7 10.29L11 13.59V3C11 2.73478 11.1054 2.48043 11.2929 2.29289C11.4804 2.10536 11.7348 2 12 2ZM3 20C2.73478 20 2.48043 20.1054 2.29289 20.2929C2.10536 20.4804 2 20.7348 2 21C2 21.2652 2.10536 21.5196 2.29289 21.7071C2.48043 21.8946 2.73478 22 3 22H21C21.2652 22 21.5196 21.8946 21.7071 21.7071C21.8946 21.5196 22 21.2652 22 21C22 20.7348 21.8946 20.4804 21.7071 20.2929C21.5196 20.1054 21.2652 20 21 20H3Z',
      },
    ],
  },
  backupRestore: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M21 2.01232C21.2652 2.01232 21.5196 2.11757 21.7071 2.30492C21.8946 2.49226 22 2.74636 22 3.0113V9.00521C22 9.27015 21.8946 9.52425 21.7071 9.7116C21.5196 9.89894 21.2652 10.0042 21 10.0042H15C14.7348 10.0042 14.4804 9.89894 14.2929 9.7116C14.1054 9.52425 14 9.27015 14 9.00521C14 8.74026 14.1054 8.48617 14.2929 8.29882C14.4804 8.11147 14.7348 8.00622 15 8.00622H18.93C18.352 7.00597 17.5638 6.14275 16.6198 5.47602C15.6758 4.80929 14.5983 4.35488 13.4616 4.1441C12.3249 3.93332 11.1559 3.97117 10.0353 4.25505C8.91459 4.53892 7.86883 5.06208 6.97 5.78848C6.76313 5.9554 6.49836 6.03338 6.23393 6.00528C5.96951 5.97718 5.72709 5.84529 5.56 5.63863C5.39291 5.43197 5.31485 5.16747 5.34298 4.90331C5.37111 4.63916 5.50313 4.39698 5.71 4.23006C6.7542 3.38308 7.959 2.7557 9.25204 2.38561C10.5451 2.01552 11.8996 1.91037 13.2344 2.07646C14.5691 2.24255 15.8565 2.67646 17.0191 3.35212C18.1818 4.02778 19.1957 4.93125 20 6.00826V3.0113C20 2.74636 20.1054 2.49226 20.2929 2.30492C20.4804 2.11757 20.7348 2.01232 21 2.01232ZM3 21.992C2.73478 21.992 2.48043 21.8867 2.29289 21.6994C2.10536 21.5121 2 21.258 2 20.993V14.9991C2 14.7342 2.10536 14.4801 2.29289 14.2927C2.48043 14.1054 2.73478 14.0001 3 14.0001H9C9.26522 14.0001 9.51957 14.1054 9.70711 14.2927C9.89464 14.4801 10 14.7342 10 14.9991C10 15.2641 9.89464 15.5182 9.70711 15.7055C9.51957 15.8928 9.26522 15.9981 9 15.9981H5.07C5.64801 16.9983 6.43617 17.8616 7.3802 18.5283C8.32424 19.195 9.40171 19.6494 10.5384 19.8602C11.6751 20.071 12.8441 20.0331 13.9647 19.7493C15.0854 19.4654 16.1312 18.9422 17.03 18.2158C17.1324 18.1332 17.2502 18.0715 17.3764 18.0343C17.5027 17.9971 17.6351 17.9851 17.7661 17.999C17.897 18.013 18.0239 18.0525 18.1395 18.1154C18.2552 18.1783 18.3573 18.2634 18.44 18.3657C18.5227 18.468 18.5845 18.5856 18.6217 18.7118C18.659 18.8379 18.6709 18.9702 18.657 19.101C18.6431 19.2318 18.6035 19.3586 18.5405 19.4741C18.4776 19.5896 18.3924 19.6916 18.29 19.7743C17.2452 20.6199 16.0403 21.2461 14.7475 21.6154C13.4547 21.9847 12.1005 22.0895 10.7662 21.9235C9.43181 21.7574 8.14476 21.324 6.98212 20.6491C5.81947 19.9743 4.80518 19.0719 4 17.9961V20.993C4 21.258 3.89464 21.5121 3.70711 21.6994C3.51957 21.8867 3.26522 21.992 3 21.992Z',
      },
    ],
  },
  cloud: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M16.8333 19H5.16667C3.16667 19 1.5 17.3333 1.5 15.3333C1.5 13.4 2.96667 11.8667 4.83333 11.6667V11.3333C4.83333 7.86667 7.7 5 11.1667 5C14.0333 5 16.5667 6.93333 17.3 9.66667C19.7 9.86667 21.5 11.8667 21.5 14.3333C21.5 16.9333 19.4333 19 16.8333 19Z',
      },
    ],
  },
  cloudDownload: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M6.5 20Q4.22 20 2.61 18.43 1 16.85 1 14.58 1 12.63 2.17 11.1 3.35 9.57 5.25 9.15 5.83 7.13 7.39 5.75 8.95 4.38 11 4.08V12.15L9.4 10.6L8 12L12 16L16 12L14.6 10.6L13 12.15V4.08Q15.58 4.43 17.29 6.39 19 8.35 19 11 20.73 11.2 21.86 12.5 23 13.78 23 15.5 23 17.38 21.69 18.69 20.38 20 18.5 20Z',
      },
    ],
  },
  cloudUpload: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M11 20H6.5Q4.22 20 2.61 18.43 1 16.85 1 14.58 1 12.63 2.17 11.1 3.35 9.57 5.25 9.15 5.88 6.85 7.75 5.43 9.63 4 12 4 14.93 4 16.96 6.04 19 8.07 19 11 20.73 11.2 21.86 12.5 23 13.78 23 15.5 23 17.38 21.69 18.69 20.38 20 18.5 20H13V12.85L14.6 14.4L16 13L12 9L8 13L9.4 14.4L11 12.85Z',
      },
    ],
  },
  restart: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M4 12a8 8 0 0 1 14.93-4H15a1 1 0 1 0 0 2h6a1 1 0 0 0 1-1V3a1 1 0 1 0-2 0v3a9.98 9.98 0 0 0-18 6 10 10 0 0 0 16.29 7.78 1 1 0 0 0-1.26-1.56A8 8 0 0 1 4 12Z',
      },
    ],
  },
  info: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M23 12a11 11 0 1 1-22 0 11 11 0 0 1 22 0Zm-9.5-4.75a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm-.77 3.96a1 1 0 1 0-1.96-.42l-1.04 4.86a2.77 2.77 0 0 0 4.31 2.83l.24-.17a1 1 0 1 0-1.16-1.62l-.24.17a.77.77 0 0 1-1.2-.79l1.05-4.86Z',
        fillRule: 'evenodd',
        clipRule: 'evenodd',
      },
    ],
  },
  search: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M15.62 17.03a9 9 0 1 1 1.41-1.41l4.68 4.67a1 1 0 0 1-1.42 1.42l-4.67-4.68ZM17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
        fillRule: 'evenodd',
        clipRule: 'evenodd',
      },
    ],
  },
  delete: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M15 3.999V2H9V3.999H3V5.999H21V3.999H15Z' },
      {
        d: 'M5 6.99902V18.999C5 20.101 5.897 20.999 7 20.999H17C18.103 20.999 19 20.101 19 18.999V6.99902H5ZM11 17H9V11H11V17ZM15 17H13V11H15V17Z',
      },
    ],
  },
  copy: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M3 16a1 1 0 0 1-1-1v-5a8 8 0 0 1 8-8h5a1 1 0 0 1 1 1v.5a.5.5 0 0 1-.5.5H10a6 6 0 0 0-6 6v5.5a.5.5 0 0 1-.5.5H3Z',
      },
      { d: 'M6 18a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-4h-3a5 5 0 0 1-5-5V6h-4a4 4 0 0 0-4 4v8Z' },
      { d: 'M21.73 12a3 3 0 0 0-.6-.88l-4.25-4.24a3 3 0 0 0-.88-.61V9a3 3 0 0 0 3 3h2.73Z' },
    ],
  },
  github: {
    viewBox: '-3 -3 30 30',
    paths: [
      {
        d: 'M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.17c-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.084 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.775.42-1.305.763-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.467-2.38 1.235-3.22-.123-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.957-.266 1.98-.398 3-.403 1.02.005 2.043.137 3 .403 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.24 2.873.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.803 5.625-5.475 5.92.43.37.823 1.102.823 2.222v3.293c0 .32.218.694.825.577C20.565 21.797 24 17.298 24 12c0-6.63-5.37-12-12-12z',
      },
    ],
  },
  openExternal: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M15 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V4.41l-4.3 4.3a1 1 0 1 1-1.4-1.42L19.58 3H16a1 1 0 0 1-1-1Z',
      },
      {
        d: 'M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-6a1 1 0 1 0-2 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6a1 1 0 1 0 0-2H5Z',
      },
    ],
  },
  starFilled: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M10.81 2.86c.38-1.15 2-1.15 2.38 0l1.89 5.83h6.12c1.2 0 1.71 1.54.73 2.25l-4.95 3.6 1.9 5.82a1.25 1.25 0 0 1-1.93 1.4L12 18.16l-4.95 3.6c-.98.7-2.3-.25-1.92-1.4l1.89-5.82-4.95-3.6a1.25 1.25 0 0 1 .73-2.25h6.12l1.9-5.83Z',
      },
    ],
  },
  starOutlined: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M2.07 10.94a1.25 1.25 0 0 1 .73-2.25h6.12l1.9-5.83c.37-1.15 2-1.15 2.37 0l1.89 5.83h6.12c1.2 0 1.71 1.54.73 2.25l-4.95 3.6 1.9 5.82a1.25 1.25 0 0 1-1.93 1.4L12 18.16l-4.95 3.6c-.98.7-2.3-.25-1.92-1.4l1.89-5.82-4.95-3.6Zm11.55-.25h5.26l-4.25 3.09 1.62 5-4.25-3.1-4.25 3.1 1.62-5-4.25-3.1h5.26l1.62-5 1.62 5Z',
        fillRule: 'evenodd',
        clipRule: 'evenodd',
      },
    ],
  },
  safety: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M4.27 5.22A2.66 2.66 0 0 0 3 7.5v2.3c0 5.6 3.3 10.68 8.42 12.95.37.17.79.17 1.16 0A14.18 14.18 0 0 0 21 9.78V7.5c0-.93-.48-1.78-1.27-2.27l-6.17-3.76a3 3 0 0 0-3.12 0L4.27 5.22ZM6 7.68l6-3.66V12H6.22C6.08 11.28 6 10.54 6 9.78v-2.1Zm6 12.01V12h5.78A11.19 11.19 0 0 1 12 19.7Z',
        fillRule: 'evenodd',
        clipRule: 'evenodd',
      },
    ],
  },
  rightArrow: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M9.3 5.3a1 1 0 0 0 0 1.4l5.29 5.3-5.3 5.3a1 1 0 1 0 1.42 1.4l6-6a1 1 0 0 0 0-1.4l-6-6a1 1 0 0 0-1.42 0Z',
      },
    ],
  },
  leftArrow: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M14.7 5.3a1 1 0 0 1 0 1.4L9.41 12l5.3 5.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z',
      },
    ],
  },
  link: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M10.59 13.41c.41.39.41 1.03 0 1.42-.39.39-1.03.39-1.42 0a5.003 5.003 0 0 1 0-7.07l3.54-3.54a5.003 5.003 0 0 1 7.07 0 5.003 5.003 0 0 1 0 7.07l-1.49 1.49c.01-.82-.12-1.64-.4-2.42l.47-.48a2.982 2.982 0 0 0 0-4.24 2.982 2.982 0 0 0-4.24 0l-3.53 3.53a2.982 2.982 0 0 0 0 4.24zm2.82-4.24c.39-.39 1.03-.39 1.42 0a5.003 5.003 0 0 1 0 7.07l-3.54 3.54a5.003 5.003 0 0 1-7.07 0 5.003 5.003 0 0 1 0-7.07l1.49-1.49c-.01.82.12 1.64.4 2.43l-.47.47a2.982 2.982 0 0 0 0 4.24 2.982 2.982 0 0 0 4.24 0l3.53-3.53a2.982 2.982 0 0 0 0-4.24.973.973 0 0 1 0-1.42z',
        fillRule: 'evenodd',
        clipRule: 'evenodd',
      },
    ],
  },
  plus: {
    viewBox: '0 0 18 18',
    paths: [{ d: 'M15 10H10V15H8V10H3V8H8V3H10V8H15Z' }],
  },
  folder: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M2 5a3 3 0 0 1 3-3h3.93a2 2 0 0 1 1.66.9L12 5h7a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5Z',
      },
    ],
  },
  log: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M3.11 8H6v10.82c0 .86.37 1.68 1 2.27.46.43 1.02.71 1.63.84A1 1 0 0 0 9 22h10a4 4 0 0 0 4-4v-1a2 2 0 0 0-2-2h-1V5a3 3 0 0 0-3-3H4.67c-.87 0-1.7.32-2.34.9-.63.6-1 1.42-1 2.28 0 .71.3 1.35.52 1.75a5.35 5.35 0 0 0 .48.7l.01.01h.01L3.11 7l-.76.65a1 1 0 0 0 .76.35Zm1.56-4c-.38 0-.72.14-.97.37-.24.23-.37.52-.37.81a1.69 1.69 0 0 0 .3.82H6v-.83c0-.29-.13-.58-.37-.8C5.4 4.14 5.04 4 4.67 4Zm5 13a3.58 3.58 0 0 1 0 3H19a2 2 0 0 0 2-2v-1H9.66ZM11 8a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2h-5Zm-1 5a1 1 0 0 1 1-1h5a1 1 0 1 1 0 2h-5a1 1 0 0 1-1-1Z',
        fillRule: 'evenodd',
        clipRule: 'evenodd',
      },
    ],
  },
  clock: {
    viewBox: '0 0 24 24',
    paths: [
      {
        d: 'M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22Zm1-18a1 1 0 1 0-2 0v7c0 .27.1.52.3.7l3 3a1 1 0 0 0 1.4-1.4L13 11.58V5Z',
        fillRule: 'evenodd',
        clipRule: 'evenodd',
      },
    ],
  },
};

interface SvgLibrary {
  Svg: any;
  Path: any;
  Circle?: any;
}

let cachedSvgLib: SvgLibrary | null | undefined = undefined;
let loggedSvgResolution = false;
let waitHooked = false;

function isReactElementType(val: unknown): boolean {
  return typeof val === 'function' || (val !== null && typeof val === 'object');
}

function extractSvgLib(mod: any): SvgLibrary | null {
  if (!mod || typeof mod !== 'object') {
    return null;
  }
  const Svg = mod.Svg ?? mod.default;
  const Path = mod.Path;
  if (!isReactElementType(Svg) || !isReactElementType(Path)) {
    return null;
  }
  const Circle = isReactElementType(mod.Circle) ? mod.Circle : undefined;
  return { Svg, Path, Circle };
}

function isSvgModule(mod: any): boolean {
  return extractSvgLib(mod) !== null;
}

function logSvgOnce(lib: SvgLibrary): void {
  if (!loggedSvgResolution) {
    loggedSvgResolution = true;
    console.log(
      `[Nekocord/Icons] Resolved react-native-svg (Svg=${Boolean(lib.Svg)}, Path=${Boolean(lib.Path)})`,
    );
  }
}

function resolveSvgLib(): SvgLibrary | null {
  if (cachedSvgLib) {
    return cachedSvgLib;
  }

  const probeGroups: string[][] = [
    ['Svg', 'Path'],
    ['Path', 'G', 'Rect'],
    ['Path', 'Circle', 'Svg'],
    ['Path', 'Circle', 'Polygon'],
  ];

  for (let i = 0; i < probeGroups.length; i += 1) {
    const mod = findByProps(...probeGroups[i]);
    const lib = extractSvgLib(mod);
    if (lib) {
      cachedSvgLib = lib;
      logSvgOnce(lib);
      return lib;
    }
  }

  if (!waitHooked) {
    waitHooked = true;
    waitFor(isSvgModule, (mod: any) => {
      const lib = extractSvgLib(mod);
      if (lib && !cachedSvgLib) {
        cachedSvgLib = lib;
        logSvgOnce(lib);
      }
    });
  }

  return null;
}

/**
 * Reports whether native {@code react-native-svg} components are available.
 */
export function hasSvgRuntime(): boolean {
  return resolveSvgLib() !== null;
}

function renderFallbackBadge(
  React: any,
  ReactNative: any,
  name: VencordIconName,
  size: number,
  color: string,
): any {
  const { View, Text } = ReactNative;
  const h = React.createElement;

  if (name === 'leftArrow' || name === 'rightArrow') {
    const dim = Math.max(8, Math.round(size * 0.45));
    return h(
      View,
      { style: { width: size, height: size, alignItems: 'center', justifyContent: 'center' } },
      h(View, {
        style: {
          width: dim,
          height: dim,
          borderColor: color,
          ...(name === 'leftArrow'
            ? { borderLeftWidth: 2, borderBottomWidth: 2, transform: [{ rotate: '45deg' }] }
            : { borderTopWidth: 2, borderRightWidth: 2, transform: [{ rotate: '45deg' }] }),
        },
      }),
    );
  }

  if (name === 'search') {
    const ring = Math.max(9, Math.round(size * 0.56));
    return h(
      View,
      { style: { width: size, height: size, alignItems: 'center', justifyContent: 'center' } },
      h(View, {
        style: {
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderWidth: 1.8,
          borderColor: color,
        },
      }),
    );
  }

  const labelMap: Partial<Record<VencordIconName, string>> = {
    nekocordLogo: 'N',
    mainSettings: 'N',
    cogWheel: '*',
    plugins: 'P',
    paintbrush: 'T',
    updater: 'U',
    backupRestore: 'B',
    info: 'i',
    starFilled: '*',
    starOutlined: '+',
    delete: 'x',
    github: 'G',
    restart: 'R',
    copy: 'C',
    cloudDownload: 'D',
    openExternal: '^',
    plus: '+',
    link: '#',
  };

  return h(
    View,
    {
      style: {
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        borderWidth: 1.6,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    h(
      Text,
      {
        style: {
          color,
          fontSize: Math.max(9, Math.round(size * 0.55)),
          fontWeight: '800',
          lineHeight: size,
        },
      },
      labelMap[name] ?? '•',
    ),
  );
}

/**
 * Renders a Vencord vector SVG icon via Discord Android's {@code react-native-svg},
 * with a clean geometric fallback if SVG primitives have not loaded yet.
 */
export function renderVencordIcon(
  React: any,
  ReactNative: any,
  name: VencordIconName,
  options: { size?: number; color: string; strokeWidth?: number },
): any {
  const size = typeof options.size === 'number' && options.size > 0 ? options.size : 20;
  const color = typeof options.color === 'string' && options.color ? options.color : '#f2f3f5';
  const lib = resolveSvgLib();
  if (!lib) {
    return renderFallbackBadge(React, ReactNative, name, size, color);
  }

  const spec = VENCORD_ICONS[name];
  const h = React.createElement;

  return h(
    lib.Svg,
    {
      width: size,
      height: size,
      viewBox: spec.viewBox,
      fill: 'none',
    },
    ...spec.paths.map((p, idx) =>
      h(lib.Path, {
        key: `${name}-${idx}`,
        d: p.d,
        fill: p.stroke ? 'none' : p.fill ?? color,
        ...(p.fillRule ? { fillRule: p.fillRule } : {}),
        ...(p.clipRule ? { clipRule: p.clipRule } : {}),
        ...(p.stroke
          ? {
              stroke: color,
              strokeWidth: options.strokeWidth ?? p.strokeWidth ?? 2,
              strokeLinecap: p.strokeLinecap ?? 'round',
              strokeLinejoin: p.strokeLinejoin ?? 'round',
            }
          : {}),
      }),
    ),
  );
}

/**
 * Renders the circular Nekocord cat mascot emblem for Vencord's SpecialCard hero banner.
 */
export function renderNekocordMascotSvg(
  React: any,
  ReactNative: any,
  size: number = 42,
): any {
  const { View, Text } = ReactNative;
  const h = React.createElement;
  const lib = resolveSvgLib();

  if (!lib) {
    return h(
      View,
      { style: { width: size, height: size, alignItems: 'center', justifyContent: 'center' } },
      h(Text, { style: { color: '#4c356b', fontSize: Math.round(size * 0.48), fontWeight: '900' } }, 'N'),
    );
  }

  return h(
    lib.Svg,
    {
      width: size,
      height: size,
      viewBox: '0 0 64 64',
      fill: 'none',
    },
    // Left and right cat ears + head silhouette in soft golden-cream
    h(lib.Path, {
      d: 'M12 28 L10 10 L26 19 C29.8 17.8 34.2 17.8 38 19 L54 10 L52 28 C55 32 56 36 56 40 C56 51.5 45.2 57 32 57 C18.8 57 8 51.5 8 40 C8 36 9 32 12 28 Z',
      fill: '#f5d287',
      stroke: '#3a2d4c',
      strokeWidth: 2.5,
      strokeLinejoin: 'round',
    }),
    // Peach inner ears
    h(lib.Path, {
      d: 'M15 24 L14 15 L23 20.5 Z',
      fill: '#f6a8be',
    }),
    h(lib.Path, {
      d: 'M49 24 L50 15 L41 20.5 Z',
      fill: '#f6a8be',
    }),
    // Eyes
    ...(lib.Circle
      ? [
          h(lib.Circle, { cx: 23, cy: 36, r: 3.1, fill: '#2c223a' }),
          h(lib.Circle, { cx: 41, cy: 36, r: 3.1, fill: '#2c223a' }),
          h(lib.Circle, { cx: 22.1, cy: 34.9, r: 1, fill: '#ffffff' }),
          h(lib.Circle, { cx: 40.1, cy: 34.9, r: 1, fill: '#ffffff' }),
        ]
      : [
          h(lib.Path, {
            d: 'M20.5 36 A2.5 2.5 0 1 0 25.5 36 A2.5 2.5 0 1 0 20.5 36 M38.5 36 A2.5 2.5 0 1 0 43.5 36 A2.5 2.5 0 1 0 38.5 36',
            fill: '#2c223a',
          }),
        ]),
    // Cute ":3" kitty mouth
    h(lib.Path, {
      d: 'M26 42.5 C27.6 45 30.8 45 32 42.5 C33.2 45 36.4 45 38 42.5',
      fill: 'none',
      stroke: '#3a2d4c',
      strokeWidth: 2.4,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  );
}

/**
 * Builds a Discord User Settings row icon component that renders an exact Vencord SVG icon.
 */
export function createSettingRowIcon(
  iconName: VencordIconName,
  getFallbackTint: () => string,
): any {
  return function NekocordSettingRowIcon(props: any) {
    const React = getReact();
    const ReactNative = getReactNative();
    if (!React || !ReactNative) {
      return null;
    }

    const rawColor = props?.color;
    const color =
      typeof rawColor === 'string' && /^(#|rgb)/i.test(rawColor.trim())
        ? rawColor.trim()
        : getFallbackTint();
    const size = typeof props?.size === 'number' && props.size > 0 ? props.size : 22;

    return renderVencordIcon(React, ReactNative, iconName, { size, color });
  };
}
