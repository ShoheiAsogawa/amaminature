// このファイルは scripts/build-ui-icons.mjs が生成します。直接編集しないでください（npm run icons:ui）。
// 図案: Phosphor Icons（MIT、@iconify-json/ph@1.2.2）と src/icons/amami/*.svg
// 使い方: <IconHouseSimple size={24} className="text-fg-2" />。色は currentColor、viewBox は 256。
import type { ReactElement, SVGProps } from 'react';

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'dangerouslySetInnerHTML' | 'ref'> & {
  /** px。タブバーとヘッダー 24、行頭 20、チップ・文中・シェブロン 16 */
  size?: number | string;
};
export type IconComponent = (props: IconProps) => ReactElement;

const B_HOUSE_SIMPLE = "<path fill=\"currentColor\" d=\"m219.31 108.68l-80-80a16 16 0 0 0-22.62 0l-80 80A15.87 15.87 0 0 0 32 120v96a8 8 0 0 0 8 8h176a8 8 0 0 0 8-8v-96a15.87 15.87 0 0 0-4.69-11.32M208 208H48v-88l80-80l80 80Z\"/>";
/** house-simple */
export function IconHouseSimple({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_HOUSE_SIMPLE }} />;
}

const B_HOUSE_SIMPLE_FILL = "<path fill=\"currentColor\" d=\"M224 120v96a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8v-96a15.87 15.87 0 0 1 4.69-11.32l80-80a16 16 0 0 1 22.62 0l80 80A15.87 15.87 0 0 1 224 120\"/>";
/** house-simple-fill */
export function IconHouseSimpleFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_HOUSE_SIMPLE_FILL }} />;
}

const B_BOOK_OPEN_TEXT = "<path fill=\"currentColor\" d=\"M232 48h-72a40 40 0 0 0-32 16a40 40 0 0 0-32-16H24a8 8 0 0 0-8 8v144a8 8 0 0 0 8 8h72a24 24 0 0 1 24 24a8 8 0 0 0 16 0a24 24 0 0 1 24-24h72a8 8 0 0 0 8-8V56a8 8 0 0 0-8-8M96 192H32V64h64a24 24 0 0 1 24 24v112a39.8 39.8 0 0 0-24-8m128 0h-64a39.8 39.8 0 0 0-24 8V88a24 24 0 0 1 24-24h64ZM160 88h40a8 8 0 0 1 0 16h-40a8 8 0 0 1 0-16m48 40a8 8 0 0 1-8 8h-40a8 8 0 0 1 0-16h40a8 8 0 0 1 8 8m0 32a8 8 0 0 1-8 8h-40a8 8 0 0 1 0-16h40a8 8 0 0 1 8 8\"/>";
/** book-open-text */
export function IconBookOpenText({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_BOOK_OPEN_TEXT }} />;
}

const B_BOOK_OPEN_TEXT_FILL = "<path fill=\"currentColor\" d=\"M232 48h-64a32 32 0 0 0-32 32v87.73a8.17 8.17 0 0 1-7.47 8.25a8 8 0 0 1-8.53-8V80a32 32 0 0 0-32-32H24a8 8 0 0 0-8 8v144a8 8 0 0 0 8 8h72a24 24 0 0 1 24 23.94a7.9 7.9 0 0 0 5.12 7.55A8 8 0 0 0 136 232a24 24 0 0 1 24-24h72a8 8 0 0 0 8-8V56a8 8 0 0 0-8-8m-24 120h-39.73a8.17 8.17 0 0 1-8.25-7.47a8 8 0 0 1 8-8.53h39.73a8.17 8.17 0 0 1 8.25 7.47a8 8 0 0 1-8 8.53m0-32h-39.73a8.17 8.17 0 0 1-8.25-7.47a8 8 0 0 1 8-8.53h39.73a8.17 8.17 0 0 1 8.25 7.47a8 8 0 0 1-8 8.53m0-32h-39.73a8.17 8.17 0 0 1-8.27-7.47a8 8 0 0 1 8-8.53h39.73a8.17 8.17 0 0 1 8.27 7.47a8 8 0 0 1-8 8.53\"/>";
/** book-open-text-fill */
export function IconBookOpenTextFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_BOOK_OPEN_TEXT_FILL }} />;
}

const B_CAMERA_FILL = "<path fill=\"currentColor\" d=\"M208 56h-27.72l-13.63-20.44A8 8 0 0 0 160 32H96a8 8 0 0 0-6.65 3.56L75.71 56H48a24 24 0 0 0-24 24v112a24 24 0 0 0 24 24h160a24 24 0 0 0 24-24V80a24 24 0 0 0-24-24m-44 76a36 36 0 1 1-36-36a36 36 0 0 1 36 36\"/>";
/** camera-fill */
export function IconCameraFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_CAMERA_FILL }} />;
}

const B_COMPASS = "<path fill=\"currentColor\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88m44.42-143.16l-64 32a8.05 8.05 0 0 0-3.58 3.58l-32 64A8 8 0 0 0 80 184a8.1 8.1 0 0 0 3.58-.84l64-32a8.05 8.05 0 0 0 3.58-3.58l32-64a8 8 0 0 0-10.74-10.74M138 138l-40.11 20.11L118 118l40.15-20.07Z\"/>";
/** compass */
export function IconCompass({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_COMPASS }} />;
}

const B_COMPASS_FILL = "<path fill=\"currentColor\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m51.58 57.79l-32 64a4.08 4.08 0 0 1-1.79 1.79l-64 32a4 4 0 0 1-5.37-5.37l32-64a4.08 4.08 0 0 1 1.79-1.79l64-32a4 4 0 0 1 5.37 5.37\"/>";
/** compass-fill */
export function IconCompassFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_COMPASS_FILL }} />;
}

const B_USER_CIRCLE = "<path fill=\"currentColor\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24M74.08 197.5a64 64 0 0 1 107.84 0a87.83 87.83 0 0 1-107.84 0M96 120a32 32 0 1 1 32 32a32 32 0 0 1-32-32m97.76 66.41a79.66 79.66 0 0 0-36.06-28.75a48 48 0 1 0-59.4 0a79.66 79.66 0 0 0-36.06 28.75a88 88 0 1 1 131.52 0\"/>";
/** user-circle */
export function IconUserCircle({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_USER_CIRCLE }} />;
}

const B_USER_CIRCLE_FILL = "<path fill=\"currentColor\" d=\"M172 120a44 44 0 1 1-44-44a44.05 44.05 0 0 1 44 44m60 8A104 104 0 1 1 128 24a104.11 104.11 0 0 1 104 104m-16 0a88.09 88.09 0 0 0-91.47-87.93C77.43 41.89 39.87 81.12 40 128.25a87.65 87.65 0 0 0 22.24 58.16A79.7 79.7 0 0 1 84 165.1a4 4 0 0 1 4.83.32a59.83 59.83 0 0 0 78.28 0a4 4 0 0 1 4.83-.32a79.7 79.7 0 0 1 21.79 21.31A87.62 87.62 0 0 0 216 128\"/>";
/** user-circle-fill */
export function IconUserCircleFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_USER_CIRCLE_FILL }} />;
}

const B_CARET_LEFT = "<path fill=\"currentColor\" d=\"M165.66 202.34a8 8 0 0 1-11.32 11.32l-80-80a8 8 0 0 1 0-11.32l80-80a8 8 0 0 1 11.32 11.32L91.31 128Z\"/>";
/** caret-left */
export function IconCaretLeft({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_CARET_LEFT }} />;
}

const B_CARET_RIGHT = "<path fill=\"currentColor\" d=\"m181.66 133.66l-80 80a8 8 0 0 1-11.32-11.32L164.69 128L90.34 53.66a8 8 0 0 1 11.32-11.32l80 80a8 8 0 0 1 0 11.32\"/>";
/** caret-right */
export function IconCaretRight({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_CARET_RIGHT }} />;
}

const B_CARET_DOWN = "<path fill=\"currentColor\" d=\"m213.66 101.66l-80 80a8 8 0 0 1-11.32 0l-80-80a8 8 0 0 1 11.32-11.32L128 164.69l74.34-74.35a8 8 0 0 1 11.32 11.32\"/>";
/** caret-down */
export function IconCaretDown({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_CARET_DOWN }} />;
}

const B_X = "<path fill=\"currentColor\" d=\"M205.66 194.34a8 8 0 0 1-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 0 1-11.32-11.32L116.69 128L50.34 61.66a8 8 0 0 1 11.32-11.32L128 116.69l66.34-66.35a8 8 0 0 1 11.32 11.32L139.31 128Z\"/>";
/** x */
export function IconX({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_X }} />;
}

const B_MAGNIFYING_GLASS = "<path fill=\"currentColor\" d=\"m229.66 218.34l-50.07-50.06a88.11 88.11 0 1 0-11.31 11.31l50.06 50.07a8 8 0 0 0 11.32-11.32M40 112a72 72 0 1 1 72 72a72.08 72.08 0 0 1-72-72\"/>";
/** magnifying-glass */
export function IconMagnifyingGlass({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_MAGNIFYING_GLASS }} />;
}

const B_SLIDERS_HORIZONTAL = "<path fill=\"currentColor\" d=\"M40 88h33a32 32 0 0 0 62 0h81a8 8 0 0 0 0-16h-81a32 32 0 0 0-62 0H40a8 8 0 0 0 0 16m64-24a16 16 0 1 1-16 16a16 16 0 0 1 16-16m112 104h-17a32 32 0 0 0-62 0H40a8 8 0 0 0 0 16h97a32 32 0 0 0 62 0h17a8 8 0 0 0 0-16m-48 24a16 16 0 1 1 16-16a16 16 0 0 1-16 16\"/>";
/** sliders-horizontal */
export function IconSlidersHorizontal({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_SLIDERS_HORIZONTAL }} />;
}

const B_SHARE_NETWORK = "<path fill=\"currentColor\" d=\"M176 160a39.9 39.9 0 0 0-28.62 12.09l-46.1-29.63a39.8 39.8 0 0 0 0-28.92l46.1-29.63a40 40 0 1 0-8.66-13.45l-46.1 29.63a40 40 0 1 0 0 55.82l46.1 29.63A40 40 0 1 0 176 160m0-128a24 24 0 1 1-24 24a24 24 0 0 1 24-24M64 152a24 24 0 1 1 24-24a24 24 0 0 1-24 24m112 72a24 24 0 1 1 24-24a24 24 0 0 1-24 24\"/>";
/** share-network */
export function IconShareNetwork({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_SHARE_NETWORK }} />;
}

const B_PENCIL_SIMPLE = "<path fill=\"currentColor\" d=\"m227.31 73.37l-44.68-44.69a16 16 0 0 0-22.63 0L36.69 152A15.86 15.86 0 0 0 32 163.31V208a16 16 0 0 0 16 16h44.69a15.86 15.86 0 0 0 11.31-4.69L227.31 96a16 16 0 0 0 0-22.63M92.69 208H48v-44.69l88-88L180.69 120ZM192 108.68L147.31 64l24-24L216 84.68Z\"/>";
/** pencil-simple */
export function IconPencilSimple({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_PENCIL_SIMPLE }} />;
}

const B_TRASH = "<path fill=\"currentColor\" d=\"M216 48h-40v-8a24 24 0 0 0-24-24h-48a24 24 0 0 0-24 24v8H40a8 8 0 0 0 0 16h8v144a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16V64h8a8 8 0 0 0 0-16M96 40a8 8 0 0 1 8-8h48a8 8 0 0 1 8 8v8H96Zm96 168H64V64h128Zm-80-104v64a8 8 0 0 1-16 0v-64a8 8 0 0 1 16 0m48 0v64a8 8 0 0 1-16 0v-64a8 8 0 0 1 16 0\"/>";
/** trash */
export function IconTrash({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_TRASH }} />;
}

const B_CHECK = "<path fill=\"currentColor\" d=\"m229.66 77.66l-128 128a8 8 0 0 1-11.32 0l-56-56a8 8 0 0 1 11.32-11.32L96 188.69L218.34 66.34a8 8 0 0 1 11.32 11.32\"/>";
/** check */
export function IconCheck({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_CHECK }} />;
}

const B_CHECK_CIRCLE_FILL = "<path fill=\"currentColor\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m45.66 85.66l-56 56a8 8 0 0 1-11.32 0l-24-24a8 8 0 0 1 11.32-11.32L112 148.69l50.34-50.35a8 8 0 0 1 11.32 11.32\"/>";
/** check-circle-fill */
export function IconCheckCircleFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_CHECK_CIRCLE_FILL }} />;
}

const B_WARNING = "<path fill=\"currentColor\" d=\"M236.8 188.09L149.35 36.22a24.76 24.76 0 0 0-42.7 0L19.2 188.09a23.51 23.51 0 0 0 0 23.72A24.35 24.35 0 0 0 40.55 224h174.9a24.35 24.35 0 0 0 21.33-12.19a23.51 23.51 0 0 0 .02-23.72m-13.87 15.71a8.5 8.5 0 0 1-7.48 4.2H40.55a8.5 8.5 0 0 1-7.48-4.2a7.59 7.59 0 0 1 0-7.72l87.45-151.87a8.75 8.75 0 0 1 15 0l87.45 151.87a7.59 7.59 0 0 1-.04 7.72M120 144v-40a8 8 0 0 1 16 0v40a8 8 0 0 1-16 0m20 36a12 12 0 1 1-12-12a12 12 0 0 1 12 12\"/>";
/** warning */
export function IconWarning({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_WARNING }} />;
}

const B_WARNING_CIRCLE_FILL = "<path fill=\"currentColor\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-8 56a8 8 0 0 1 16 0v56a8 8 0 0 1-16 0Zm8 104a12 12 0 1 1 12-12a12 12 0 0 1-12 12\"/>";
/** warning-circle-fill */
export function IconWarningCircleFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_WARNING_CIRCLE_FILL }} />;
}

const B_INFO = "<path fill=\"currentColor\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88m16-40a8 8 0 0 1-8 8a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 8 8m-32-92a12 12 0 1 1 12 12a12 12 0 0 1-12-12\"/>";
/** info */
export function IconInfo({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_INFO }} />;
}

const B_CIRCLE_NOTCH = "<path fill=\"currentColor\" d=\"M232 128a104 104 0 0 1-208 0c0-41 23.81-78.36 60.66-95.27a8 8 0 0 1 6.68 14.54C60.15 61.59 40 93.27 40 128a88 88 0 0 0 176 0c0-34.73-20.15-66.41-51.34-80.73a8 8 0 0 1 6.68-14.54C208.19 49.64 232 87 232 128\"/>";
/** circle-notch */
export function IconCircleNotch({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_CIRCLE_NOTCH }} />;
}

const B_ARROW_CLOCKWISE = "<path fill=\"currentColor\" d=\"M240 56v48a8 8 0 0 1-8 8h-48a8 8 0 0 1 0-16h27.4l-26.59-24.36l-.25-.24a80 80 0 1 0-1.67 114.78a8 8 0 0 1 11 11.63A95.44 95.44 0 0 1 128 224h-1.32a96 96 0 1 1 69.07-164L224 85.8V56a8 8 0 1 1 16 0\"/>";
/** arrow-clockwise */
export function IconArrowClockwise({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_ARROW_CLOCKWISE }} />;
}

const B_ARROW_COUNTER_CLOCKWISE = "<path fill=\"currentColor\" d=\"M224 128a96 96 0 0 1-94.71 96H128a95.38 95.38 0 0 1-65.9-26.2a8 8 0 0 1 11-11.63a80 80 0 1 0-1.67-114.78a3 3 0 0 1-.26.25L44.59 96H72a8 8 0 0 1 0 16H24a8 8 0 0 1-8-8V56a8 8 0 0 1 16 0v29.8L60.25 60A96 96 0 0 1 224 128\"/>";
/** arrow-counter-clockwise */
export function IconArrowCounterClockwise({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_ARROW_COUNTER_CLOCKWISE }} />;
}

const B_ARROW_SQUARE_OUT = "<path fill=\"currentColor\" d=\"M224 104a8 8 0 0 1-16 0V59.32l-66.33 66.34a8 8 0 0 1-11.32-11.32L196.68 48H152a8 8 0 0 1 0-16h64a8 8 0 0 1 8 8Zm-40 24a8 8 0 0 0-8 8v72H48V80h72a8 8 0 0 0 0-16H48a16 16 0 0 0-16 16v128a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16v-72a8 8 0 0 0-8-8\"/>";
/** arrow-square-out */
export function IconArrowSquareOut({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_ARROW_SQUARE_OUT }} />;
}

const B_HEART = "<path fill=\"currentColor\" d=\"M178 40c-20.65 0-38.73 8.88-50 23.89C116.73 48.88 98.65 40 78 40a62.07 62.07 0 0 0-62 62c0 70 103.79 126.66 108.21 129a8 8 0 0 0 7.58 0C136.21 228.66 240 172 240 102a62.07 62.07 0 0 0-62-62m-50 174.8c-18.26-10.64-96-59.11-96-112.8a46.06 46.06 0 0 1 46-46c19.45 0 35.78 10.36 42.6 27a8 8 0 0 0 14.8 0c6.82-16.67 23.15-27 42.6-27a46.06 46.06 0 0 1 46 46c0 53.61-77.76 102.15-96 112.8\"/>";
/** heart */
export function IconHeart({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_HEART }} />;
}

const B_HEART_FILL = "<path fill=\"currentColor\" d=\"M240 102c0 70-103.79 126.66-108.21 129a8 8 0 0 1-7.58 0C119.79 228.66 16 172 16 102a62.07 62.07 0 0 1 62-62c20.65 0 38.73 8.88 50 23.89C139.27 48.88 157.35 40 178 40a62.07 62.07 0 0 1 62 62\"/>";
/** heart-fill */
export function IconHeartFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_HEART_FILL }} />;
}

const B_DOTS_THREE = "<path fill=\"currentColor\" d=\"M140 128a12 12 0 1 1-12-12a12 12 0 0 1 12 12m56-12a12 12 0 1 0 12 12a12 12 0 0 0-12-12m-136 0a12 12 0 1 0 12 12a12 12 0 0 0-12-12\"/>";
/** dots-three */
export function IconDotsThree({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_DOTS_THREE }} />;
}

const B_BIRD = "<path fill=\"currentColor\" d=\"M176 68a12 12 0 1 1-12-12a12 12 0 0 1 12 12m64 12a8 8 0 0 1-3.56 6.66L216 100.28V120a104.11 104.11 0 0 1-104 104H24a16 16 0 0 1-12.49-26l.1-.12L96 96.63V76.89c0-33.42 26.79-60.73 59.71-60.89h.29a60 60 0 0 1 57.21 41.86l23.23 15.48A8 8 0 0 1 240 80m-22.42 0L201.9 69.54a8 8 0 0 1-3.31-4.64A44 44 0 0 0 156 32h-.22C131.64 32.12 112 52.25 112 76.89v22.63a8 8 0 0 1-1.85 5.13L24 208h26.9l70.94-85.12a8 8 0 1 1 12.29 10.24L71.75 208H112a88.1 88.1 0 0 0 88-88V96a8 8 0 0 1 3.56-6.66Z\"/>";
/** bird */
export function IconBird({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_BIRD }} />;
}

const B_BUTTERFLY = "<path fill=\"currentColor\" d=\"M232.7 50.48C229 45.7 221.84 40 209 40c-16.85 0-38.46 11.28-57.81 30.16A140 140 0 0 0 136 87.53V56a8 8 0 0 0-16 0v31.53a140 140 0 0 0-15.15-17.37C85.49 51.28 63.88 40 47 40c-12.84 0-20 5.7-23.7 10.48c-6.82 8.77-12.18 24.08-.21 71.2c6.05 23.83 19.51 33 30.63 36.42A44 44 0 0 0 128 205.27a44 44 0 0 0 74.28-47.17c11.12-3.4 24.57-12.59 30.63-36.42c6.72-26.44 11.94-55.58-.21-71.2M92 208a28.12 28.12 0 0 1-3.14-56a8 8 0 1 0-1.76-15.9a43.64 43.64 0 0 0-20.74 7.9c-8.43.09-22-3.57-27.76-26.26c-2.88-11.35-11.6-45.88-2.66-57.44C37.37 58.46 40.09 56 47 56c27.27 0 73 44.88 73 71.67V180a28 28 0 0 1-28 28m125.4-90.26c-5.77 22.69-19.33 26.34-27.77 26.26a43.6 43.6 0 0 0-20.74-7.95a8 8 0 1 0-1.76 15.9A28.11 28.11 0 1 1 136 180v-52.33C136 100.88 181.69 56 209 56c6.95 0 9.66 2.46 11.1 4.3c8.95 11.56.18 46.09-2.7 57.44\"/>";
/** butterfly */
export function IconButterfly({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_BUTTERFLY }} />;
}

const B_FISH_SIMPLE = "<path fill=\"currentColor\" d=\"M168 76a12 12 0 1 1-12-12a12 12 0 0 1 12 12m42 79.08c-15.08 20.84-37.53 34.88-66.7 41.74c-20.08 4.72-43.54 6-70.12 3.93q2.4 17.82 6.72 37.54a8 8 0 0 1-6.1 9.52a7.8 7.8 0 0 1-1.72.19a8 8 0 0 1-7.81-6.29q-4.89-22.36-7.41-42.62q-20.22-2.51-42.58-7.41a8 8 0 0 1 3.43-15.63q19.7 4.32 37.5 6.73c-2.09-26.56-.78-50 3.93-70.06C66 83.55 80.05 61.1 100.88 46c14.12-10.24 39.27-22.36 78.39-22c21.19.21 40.83 4.33 43.81 6.08a8 8 0 0 1 2.83 2.83c1.75 3 5.87 22.59 6.08 43.78c.22 21.62-3.42 52.75-21.99 78.39m-23.76 2.8a112.07 112.07 0 0 1-88.12-88.14C75.64 94 66.7 132.47 71.36 184.6c52.15 4.68 90.64-4.25 114.89-26.72Zm26.2-114.32a175.8 175.8 0 0 0-39.22-3.51c-24.34.64-44.71 6.49-60.76 17.39a96 96 0 0 0 86.09 86.1c10.91-16 16.76-36.42 17.4-60.76a175.8 175.8 0 0 0-3.51-39.22\"/>";
/** fish-simple */
export function IconFishSimple({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_FISH_SIMPLE }} />;
}

const B_FOOTPRINTS_FILL = "<path fill=\"currentColor\" d=\"M216.06 192v12a36 36 0 0 1-72.06 0v-12a8 8 0 0 1 8-8h56a8 8 0 0 1 8.06 8M104 160H48a8 8 0 0 0-8 8v12a36 36 0 0 0 72 0v-12a8 8 0 0 0-8-8M76 16c-11.64 0-22.93 10.31-31.8 29c-13.93 29.38-18.56 73 .29 96a8 8 0 0 0 6.2 2.93h50.55a8 8 0 0 0 6.2-2.93c18.85-23 14.22-66.65.29-96C98.85 26.31 87.57 16 76 16m78.8 152h50.55a8 8 0 0 0 6.2-2.93c18.85-23 14.22-66.65.29-96C202.93 50.31 191.64 40 180 40s-22.89 10.31-31.77 29c-13.93 29.38-18.56 73 .29 96a8 8 0 0 0 6.24 3Z\"/>";
/** footprints-fill */
export function IconFootprintsFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_FOOTPRINTS_FILL }} />;
}

const B_TROPHY_FILL = "<path fill=\"currentColor\" d=\"M232 64h-24V48a8 8 0 0 0-8-8H56a8 8 0 0 0-8 8v16H24A16 16 0 0 0 8 80v16a40 40 0 0 0 40 40h3.65A80.13 80.13 0 0 0 120 191.61V216H96a8 8 0 0 0 0 16h64a8 8 0 0 0 0-16h-24v-24.42c31.94-3.23 58.44-25.64 68.08-55.58H208a40 40 0 0 0 40-40V80a16 16 0 0 0-16-16M48 120a24 24 0 0 1-24-24V80h24v32q0 4 .39 8Zm184-24a24 24 0 0 1-24 24h-.5a82 82 0 0 0 .5-8.9V80h24Z\"/>";
/** trophy-fill */
export function IconTrophyFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_TROPHY_FILL }} />;
}

const B_FEATHER_FILL = "<path fill=\"currentColor\" d=\"m211.84 134.81l-59.79 60.47a15.75 15.75 0 0 1-11.2 4.68H75.32l-29.66 29.7a8 8 0 0 1-11.32-11.32l22.59-22.58L124.7 128H209a4 4 0 0 1 2.84 6.81m4.86-104.24a64 64 0 0 0-85.9 4.14l-9.6 9.48A4 4 0 0 0 120 47v63l55-55a8 8 0 0 1 11.31 11.31L140.71 112h88.38a4 4 0 0 0 3.56-2.16a64.08 64.08 0 0 0-15.95-79.27M62.83 167.23L104 126.06v-55.3a4 4 0 0 0-6.81-2.84L60.69 104A15.9 15.9 0 0 0 56 115.31v49.09a4 4 0 0 0 6.83 2.83\"/>";
/** feather-fill */
export function IconFeatherFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_FEATHER_FILL }} />;
}

const B_BINOCULARS_FILL = "<path fill=\"currentColor\" d=\"M237.22 151.9v-.1a1.4 1.4 0 0 0-.07-.22a49 49 0 0 0-2.31-5.3L193.27 51.8a8 8 0 0 0-1.67-2.44a32 32 0 0 0-45.26 0A8 8 0 0 0 144 55v25h-32V55a8 8 0 0 0-2.34-5.66a32 32 0 0 0-45.26 0a8 8 0 0 0-1.67 2.44l-41.53 94.5a49 49 0 0 0-2.31 5.3a2 2 0 0 0-.07.21s0 .08 0 .11a48 48 0 0 0 90.32 32.51a47.5 47.5 0 0 0 2.9-16.59V96h32v71.83a47.5 47.5 0 0 0 2.9 16.59a48 48 0 0 0 90.32-32.51Zm-143.15 27a32 32 0 0 1-60.2-21.71l1.81-4.13A32 32 0 0 1 96 167.88v.12a32 32 0 0 1-1.93 10.94ZM203 198.07A32 32 0 0 1 160 168v-.11a32 32 0 0 1 60.32-14.78l1.81 4.13A32 32 0 0 1 203 198.07\"/>";
/** binoculars-fill */
export function IconBinocularsFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_BINOCULARS_FILL }} />;
}

const B_MOON_STARS_FILL = "<path fill=\"currentColor\" d=\"M240 96a8 8 0 0 1-8 8h-16v16a8 8 0 0 1-16 0v-16h-16a8 8 0 0 1 0-16h16V72a8 8 0 0 1 16 0v16h16a8 8 0 0 1 8 8m-96-40h8v8a8 8 0 0 0 16 0v-8h8a8 8 0 0 0 0-16h-8v-8a8 8 0 0 0-16 0v8h-8a8 8 0 0 0 0 16m65.14 94.33A88.07 88.07 0 0 1 105.67 46.86a8 8 0 0 0-10.6-9.06A96 96 0 1 0 218.2 160.93a8 8 0 0 0-9.06-10.6\"/>";
/** moon-stars-fill */
export function IconMoonStarsFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_MOON_STARS_FILL }} />;
}

const B_ISLAND_FILL = "<path fill=\"currentColor\" d=\"M239.55 226.65A8 8 0 0 1 232 232H24a8 8 0 0 1-5-14.25c1.63-1.3 38.53-30.26 98.29-33.45a120 120 0 0 1-3.29-37.93c1.73-21.71 10.91-50.63 42.95-72.48a66.3 66.3 0 0 0-15-1.87h-1.67c-19 .62-30.94 11.71-36.5 33.92A8 8 0 0 1 96 112a7.7 7.7 0 0 1-2-.24a8 8 0 0 1-5.82-9.7c9.25-36.95 33.11-45.42 51.5-46a81.4 81.4 0 0 1 21.68 2.45c-3.82-6.33-9.42-12.93-17.21-16.25c-10-4.24-22.17-2.39-36.31 5.51a8 8 0 0 1-7.8-14c18.74-10.45 35.72-12.54 50.48-6.2c12.49 5.36 20.73 15.78 25.88 25c6.17-9.64 13.87-16.17 22.38-18.94c11.86-3.87 24.64-.72 38 9.37a8 8 0 0 1-9.64 12.76c-8.91-6.73-16.77-9.06-23.34-6.93c-7.3 2.35-12.87 10-16.38 16.61A70.5 70.5 0 0 1 208 73.07c14.61 8.35 32 26.05 32 62.94a8 8 0 0 1-16 0c0-23.46-8.06-40-24-49a51 51 0 0 0-5.75-2.8a55.64 55.64 0 0 1 5.06 33.06a59.4 59.4 0 0 1-8.86 23.41a8 8 0 0 1-13.09-9.2c.75-1.09 16.33-24.38-3.26-49.37c-27 15.21-41.89 37.25-44.16 65.59a104.3 104.3 0 0 0 3.83 36.44c62.65 1.81 101.52 32.33 103.2 33.66a8 8 0 0 1 2.58 8.85M52 168a28 28 0 1 0-28-28a28 28 0 0 0 28 28\"/>";
/** island-fill */
export function IconIslandFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_ISLAND_FILL }} />;
}

const B_WAVES_FILL = "<path fill=\"currentColor\" d=\"M208 32H48a16 16 0 0 0-16 16v160a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16m-10.8 144.87c-13.07 11.18-24.9 15.1-35.64 15.1c-14.26 0-26.62-6.92-37.47-13c-18.41-10.31-32.95-18.45-54.89.31a8 8 0 1 1-10.4-12.16c30.42-26 54.09-12.76 73.11-2.11c18.41 10.31 33 18.45 54.89-.31a8 8 0 0 1 10.4 12.16Zm0-44c-13.07 11.18-24.9 15.1-35.64 15.1c-14.26 0-26.62-6.92-37.47-13c-18.41-10.31-32.95-18.45-54.89.31a8 8 0 0 1-10.4-12.16c30.42-26 54.09-12.76 73.11-2.11c18.41 10.31 33 18.45 54.89-.31a8 8 0 1 1 10.4 12.16Zm0-44c-13.07 11.18-24.9 15.1-35.64 15.1c-14.26 0-26.62-6.92-37.47-13c-18.41-10.31-32.95-18.45-54.89.31a8 8 0 0 1-10.4-12.15c30.42-26 54.09-12.76 73.11-2.11c18.41 10.31 33 18.45 54.89-.31a8 8 0 1 1 10.4 12.16\"/>";
/** waves-fill */
export function IconWavesFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_WAVES_FILL }} />;
}

const B_SAILBOAT_FILL = "<path fill=\"currentColor\" d=\"M160 140V72.85a4 4 0 0 1 7-2.69l55 60.46a8 8 0 0 1 .43 10.26a8.24 8.24 0 0 1-6.58 3.12H164a4 4 0 0 1-4-4m87.21 32.53A8 8 0 0 0 240 168h-96V8a8 8 0 0 0-14.21-5l-104 128A8 8 0 0 0 32 144h96v24H16a8 8 0 0 0-6.25 13l29.6 37a15.93 15.93 0 0 0 12.49 6h152.32a15.93 15.93 0 0 0 12.49-6l29.6-37a8 8 0 0 0 .96-8.47\"/>";
/** sailboat-fill */
export function IconSailboatFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_SAILBOAT_FILL }} />;
}

const B_SUN_HORIZON_FILL = "<path fill=\"currentColor\" d=\"M248 160a8 8 0 0 1-8 8H16a8 8 0 0 1 0-16h40.45a74 74 0 0 1-.45-8a72 72 0 0 1 144 0a74 74 0 0 1-.45 8H240a8 8 0 0 1 8 8m-40 32H48a8 8 0 0 0 0 16h160a8 8 0 0 0 0-16M80.84 59.58a8 8 0 0 0 14.32-7.16l-8-16a8 8 0 0 0-14.32 7.16Zm-60.42 43.58l16 8a8 8 0 1 0 7.16-14.31l-16-8a8 8 0 1 0-7.16 14.31M216 112a8 8 0 0 0 3.57-.84l16-8a8 8 0 1 0-7.16-14.31l-16 8A8 8 0 0 0 216 112m-51.58-48.84a8 8 0 0 0 10.74-3.58l8-16a8 8 0 0 0-14.32-7.16l-8 16a8 8 0 0 0 3.58 10.74\"/>";
/** sun-horizon-fill */
export function IconSunHorizonFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_SUN_HORIZON_FILL }} />;
}

const B_HAND_HEART_FILL = "<path fill=\"currentColor\" d=\"M230.33 141.06a24.34 24.34 0 0 0-18.61-4.77C230.5 117.33 240 98.48 240 80c0-26.47-21.29-48-47.46-48A47.58 47.58 0 0 0 156 48.75A47.58 47.58 0 0 0 119.46 32C93.29 32 72 53.53 72 80c0 11 3.24 21.69 10.06 33a31.87 31.87 0 0 0-14.75 8.4L44.69 144H16a16 16 0 0 0-16 16v40a16 16 0 0 0 16 16h104a8 8 0 0 0 1.94-.24l64-16a7 7 0 0 0 1.19-.4L226 182.82l.44-.2a24.6 24.6 0 0 0 3.93-41.56Zm-10.9 27.15l-38 16.18L119 200H56v-44.69l22.63-22.62A15.86 15.86 0 0 1 89.94 128H140a12 12 0 0 1 0 24h-28a8 8 0 0 0 0 16h32a8.3 8.3 0 0 0 1.79-.2l67-15.41l.31-.08a8.6 8.6 0 0 1 6.3 15.9Z\"/>";
/** hand-heart-fill */
export function IconHandHeartFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_HAND_HEART_FILL }} />;
}

const B_CAR_PROFILE_FILL = "<path fill=\"currentColor\" d=\"M240 112h-28.69L168 68.69A15.86 15.86 0 0 0 156.69 64H44.28A16 16 0 0 0 31 71.12L1.34 115.56A8.07 8.07 0 0 0 0 120v48a16 16 0 0 0 16 16h17a32 32 0 0 0 62 0h66a32 32 0 0 0 62 0h17a16 16 0 0 0 16-16v-40a16 16 0 0 0-16-16M44.28 80h112.41l32 32H23ZM64 192a16 16 0 1 1 16-16a16 16 0 0 1-16 16m128 0a16 16 0 1 1 16-16a16 16 0 0 1-16 16\"/>";
/** car-profile-fill */
export function IconCarProfileFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_CAR_PROFILE_FILL }} />;
}

const B_ROAD_HORIZON_FILL = "<path fill=\"currentColor\" d=\"M239 188.08L173.68 72h58a8.17 8.17 0 0 0 8.32-7.47a8 8 0 0 0-8-8.53H24.27A8.17 8.17 0 0 0 16 63.47A8 8 0 0 0 24 72h58.32L17 188.08a8 8 0 0 0 1.17 9.43a8.24 8.24 0 0 0 6 2.49H116a4 4 0 0 0 4-4v-19.73a8.17 8.17 0 0 1 7.47-8.25a8 8 0 0 1 8.53 8v20a4 4 0 0 0 4 4h91.77a8.24 8.24 0 0 0 6-2.49a8 8 0 0 0 1.23-9.45M136 140a8 8 0 0 1-16 0v-16a8 8 0 0 1 16 0Zm0-52a8 8 0 0 1-16 0v-8a8 8 0 0 1 16 0Z\"/>";
/** road-horizon-fill */
export function IconRoadHorizonFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_ROAD_HORIZON_FILL }} />;
}

const B_MOON_STARS = "<path fill=\"currentColor\" d=\"M240 96a8 8 0 0 1-8 8h-16v16a8 8 0 0 1-16 0v-16h-16a8 8 0 0 1 0-16h16V72a8 8 0 0 1 16 0v16h16a8 8 0 0 1 8 8m-96-40h8v8a8 8 0 0 0 16 0v-8h8a8 8 0 0 0 0-16h-8v-8a8 8 0 0 0-16 0v8h-8a8 8 0 0 0 0 16m72.77 97a8 8 0 0 1 1.43 8A96 96 0 1 1 95.07 37.8a8 8 0 0 1 10.6 9.06a88.07 88.07 0 0 0 103.47 103.47a8 8 0 0 1 7.63 2.67m-19.39 14.88c-1.79.09-3.59.14-5.38.14A104.11 104.11 0 0 1 88 64c0-1.79 0-3.59.14-5.38a80 80 0 1 0 109.24 109.24Z\"/>";
/** moon-stars */
export function IconMoonStars({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_MOON_STARS }} />;
}

const B_ROAD_HORIZON = "<path fill=\"currentColor\" d=\"M235.92 199a8 8 0 0 1-10.92-3.08L155.32 72H136v8a8 8 0 0 1-16 0v-8h-19.32L31 195.92a8 8 0 0 1-14-7.84L82.32 72H24a8 8 0 0 1 0-16h208a8 8 0 0 1 0 16h-58.32L239 188.08a8 8 0 0 1-3.08 10.92M128 112a8 8 0 0 0-8 8v16a8 8 0 0 0 16 0v-16a8 8 0 0 0-8-8m0 56a8 8 0 0 0-8 8v16a8 8 0 0 0 16 0v-16a8 8 0 0 0-8-8\"/>";
/** road-horizon */
export function IconRoadHorizon({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_ROAD_HORIZON }} />;
}

const B_CAR_PROFILE = "<path fill=\"currentColor\" d=\"M240 112h-28.69L168 68.69A15.86 15.86 0 0 0 156.69 64H44.28A16 16 0 0 0 31 71.12L1.34 115.56A8.07 8.07 0 0 0 0 120v48a16 16 0 0 0 16 16h17a32 32 0 0 0 62 0h66a32 32 0 0 0 62 0h17a16 16 0 0 0 16-16v-40a16 16 0 0 0-16-16M44.28 80h112.41l32 32H23ZM64 192a16 16 0 1 1 16-16a16 16 0 0 1-16 16m128 0a16 16 0 1 1 16-16a16 16 0 0 1-16 16m48-24h-17a32 32 0 0 0-62 0H95a32 32 0 0 0-62 0H16v-40h224Z\"/>";
/** car-profile */
export function IconCarProfile({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_CAR_PROFILE }} />;
}

const B_GAUGE = "<path fill=\"currentColor\" d=\"M207.06 72.67A111.24 111.24 0 0 0 128 40h-.4C66.07 40.21 16 91 16 153.13V176a16 16 0 0 0 16 16h192a16 16 0 0 0 16-16v-24a111.25 111.25 0 0 0-32.94-79.33M224 176H119.71l54.76-75.3a8 8 0 0 0-12.94-9.42L99.92 176H32v-22.87c0-3.08.15-6.12.43-9.13H56a8 8 0 0 0 0-16H35.27c10.32-38.86 44-68.24 84.73-71.66V80a8 8 0 0 0 16 0V56.33A96.14 96.14 0 0 1 221 128h-21a8 8 0 0 0 0 16h23.67c.21 2.65.33 5.31.33 8Z\"/>";
/** gauge */
export function IconGauge({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_GAUGE }} />;
}

const B_FLASHLIGHT = "<path fill=\"currentColor\" d=\"M184 16H72a16 16 0 0 0-16 16v45.33a16.12 16.12 0 0 0 3.2 9.6L80 114.67V224a16 16 0 0 0 16 16h64a16 16 0 0 0 16-16V114.67l20.8-27.74a16.12 16.12 0 0 0 3.2-9.6V32a16 16 0 0 0-16-16M72 32h112v24H72zm91.2 73.07a16.12 16.12 0 0 0-3.2 9.6V224H96V114.67a16.12 16.12 0 0 0-3.2-9.6L72 77.33V72h112v5.33ZM136 120v32a8 8 0 0 1-16 0v-32a8 8 0 0 1 16 0\"/>";
/** flashlight */
export function IconFlashlight({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_FLASHLIGHT }} />;
}

const B_DEVICE_MOBILE = "<path fill=\"currentColor\" d=\"M176 16H80a24 24 0 0 0-24 24v176a24 24 0 0 0 24 24h96a24 24 0 0 0 24-24V40a24 24 0 0 0-24-24M72 64h112v128H72Zm8-32h96a8 8 0 0 1 8 8v8H72v-8a8 8 0 0 1 8-8m96 192H80a8 8 0 0 1-8-8v-8h112v8a8 8 0 0 1-8 8\"/>";
/** device-mobile */
export function IconDeviceMobile({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_DEVICE_MOBILE }} />;
}

const B_MAP_PIN = "<path fill=\"currentColor\" d=\"M128 64a40 40 0 1 0 40 40a40 40 0 0 0-40-40m0 64a24 24 0 1 1 24-24a24 24 0 0 1-24 24m0-112a88.1 88.1 0 0 0-88 88c0 31.4 14.51 64.68 42 96.25a254.2 254.2 0 0 0 41.45 38.3a8 8 0 0 0 9.18 0a254.2 254.2 0 0 0 41.37-38.3c27.45-31.57 42-64.85 42-96.25a88.1 88.1 0 0 0-88-88m0 206c-16.53-13-72-60.75-72-118a72 72 0 0 1 144 0c0 57.23-55.47 105-72 118\"/>";
/** map-pin */
export function IconMapPin({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_MAP_PIN }} />;
}

const B_GPS_FIX = "<path fill=\"currentColor\" d=\"M240 120h-24.37A88.13 88.13 0 0 0 136 40.37V16a8 8 0 0 0-16 0v24.37A88.13 88.13 0 0 0 40.37 120H16a8 8 0 0 0 0 16h24.37A88.13 88.13 0 0 0 120 215.63V240a8 8 0 0 0 16 0v-24.37A88.13 88.13 0 0 0 215.63 136H240a8 8 0 0 0 0-16m-112 80a72 72 0 1 1 72-72a72.08 72.08 0 0 1-72 72m0-112a40 40 0 1 0 40 40a40 40 0 0 0-40-40m0 64a24 24 0 1 1 24-24a24 24 0 0 1-24 24\"/>";
/** gps-fix */
export function IconGpsFix({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_GPS_FIX }} />;
}

const B_CALENDAR_BLANK = "<path fill=\"currentColor\" d=\"M208 32h-24v-8a8 8 0 0 0-16 0v8H88v-8a8 8 0 0 0-16 0v8H48a16 16 0 0 0-16 16v160a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16M72 48v8a8 8 0 0 0 16 0v-8h80v8a8 8 0 0 0 16 0v-8h24v32H48V48Zm136 160H48V96h160z\"/>";
/** calendar-blank */
export function IconCalendarBlank({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_CALENDAR_BLANK }} />;
}

const B_CLOCK = "<path fill=\"currentColor\" d=\"M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88m64-88a8 8 0 0 1-8 8h-56a8 8 0 0 1-8-8V72a8 8 0 0 1 16 0v48h48a8 8 0 0 1 8 8\"/>";
/** clock */
export function IconClock({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_CLOCK }} />;
}

const B_IMAGE_SQUARE = "<path fill=\"currentColor\" d=\"M208 32H48a16 16 0 0 0-16 16v160a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16M48 48h160v77.38l-24.69-24.7a16 16 0 0 0-22.62 0L53.37 208H48Zm160 160H76l96-96l36 36zM96 120a24 24 0 1 0-24-24a24 24 0 0 0 24 24m0-32a8 8 0 1 1-8 8a8 8 0 0 1 8-8\"/>";
/** image-square */
export function IconImageSquare({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_IMAGE_SQUARE }} />;
}

const B_MICROPHONE = "<path fill=\"currentColor\" d=\"M128 176a48.05 48.05 0 0 0 48-48V64a48 48 0 0 0-96 0v64a48.05 48.05 0 0 0 48 48M96 64a32 32 0 0 1 64 0v64a32 32 0 0 1-64 0Zm40 143.6V240a8 8 0 0 1-16 0v-32.4A80.11 80.11 0 0 1 48 128a8 8 0 0 1 16 0a64 64 0 0 0 128 0a8 8 0 0 1 16 0a80.11 80.11 0 0 1-72 79.6\"/>";
/** microphone */
export function IconMicrophone({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_MICROPHONE }} />;
}

const B_SCAN = "<path fill=\"currentColor\" d=\"M224 40v40a8 8 0 0 1-16 0V48h-32a8 8 0 0 1 0-16h40a8 8 0 0 1 8 8M80 208H48v-32a8 8 0 0 0-16 0v40a8 8 0 0 0 8 8h40a8 8 0 0 0 0-16m136-40a8 8 0 0 0-8 8v32h-32a8 8 0 0 0 0 16h40a8 8 0 0 0 8-8v-40a8 8 0 0 0-8-8M40 88a8 8 0 0 0 8-8V48h32a8 8 0 0 0 0-16H40a8 8 0 0 0-8 8v40a8 8 0 0 0 8 8m40-16h96a8 8 0 0 1 8 8v96a8 8 0 0 1-8 8H80a8 8 0 0 1-8-8V80a8 8 0 0 1 8-8m8 96h80V88H88Z\"/>";
/** scan */
export function IconScan({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_SCAN }} />;
}

const B_DICE_FIVE = "<path fill=\"currentColor\" d=\"M192 32H64a32 32 0 0 0-32 32v128a32 32 0 0 0 32 32h128a32 32 0 0 0 32-32V64a32 32 0 0 0-32-32m16 160a16 16 0 0 1-16 16H64a16 16 0 0 1-16-16V64a16 16 0 0 1 16-16h128a16 16 0 0 1 16 16ZM104 92a12 12 0 1 1-12-12a12 12 0 0 1 12 12m72 0a12 12 0 1 1-12-12a12 12 0 0 1 12 12m-72 72a12 12 0 1 1-12-12a12 12 0 0 1 12 12m36-36a12 12 0 1 1-12-12a12 12 0 0 1 12 12m36 36a12 12 0 1 1-12-12a12 12 0 0 1 12 12\"/>";
/** dice-five */
export function IconDiceFive({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_DICE_FIVE }} />;
}

const B_HAND_HEART = "<path fill=\"currentColor\" d=\"M230.33 141.06a24.34 24.34 0 0 0-18.61-4.77C230.5 117.33 240 98.48 240 80c0-26.47-21.29-48-47.46-48A47.58 47.58 0 0 0 156 48.75A47.58 47.58 0 0 0 119.46 32C93.29 32 72 53.53 72 80c0 11 3.24 21.69 10.06 33a31.87 31.87 0 0 0-14.75 8.4L44.69 144H16a16 16 0 0 0-16 16v40a16 16 0 0 0 16 16h104a8 8 0 0 0 1.94-.24l64-16a7 7 0 0 0 1.19-.4L226 182.82l.44-.2a24.6 24.6 0 0 0 3.93-41.56ZM119.46 48a31.15 31.15 0 0 1 29.14 19a8 8 0 0 0 14.8 0a31.15 31.15 0 0 1 29.14-19C209.59 48 224 62.65 224 80c0 19.51-15.79 41.58-45.66 63.9l-11.09 2.55A28 28 0 0 0 140 112h-39.32C92.05 100.36 88 90.12 88 80c0-17.35 14.41-32 31.46-32M16 160h24v40H16Zm203.43 8.21l-38 16.18L119 200H56v-44.69l22.63-22.62A15.86 15.86 0 0 1 89.94 128H140a12 12 0 0 1 0 24h-28a8 8 0 0 0 0 16h32a8.3 8.3 0 0 0 1.79-.2l67-15.41l.31-.08a8.6 8.6 0 0 1 6.3 15.9Z\"/>";
/** hand-heart */
export function IconHandHeart({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_HAND_HEART }} />;
}

const B_TICKET = "<path fill=\"currentColor\" d=\"M232 104a8 8 0 0 0 8-8V64a16 16 0 0 0-16-16H32a16 16 0 0 0-16 16v32a8 8 0 0 0 8 8a24 24 0 0 1 0 48a8 8 0 0 0-8 8v32a16 16 0 0 0 16 16h192a16 16 0 0 0 16-16v-32a8 8 0 0 0-8-8a24 24 0 0 1 0-48M32 167.2a40 40 0 0 0 0-78.4V64h56v128H32Zm192 0V192H104V64h120v24.8a40 40 0 0 0 0 78.4\"/>";
/** ticket */
export function IconTicket({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_TICKET }} />;
}

const B_GIFT = "<path fill=\"currentColor\" d=\"M216 72h-35.08c.39-.33.79-.65 1.17-1A29.53 29.53 0 0 0 192 49.57A32.62 32.62 0 0 0 158.44 16A29.53 29.53 0 0 0 137 25.91a55 55 0 0 0-9 14.48a55 55 0 0 0-9-14.48A29.53 29.53 0 0 0 97.56 16A32.62 32.62 0 0 0 64 49.57A29.53 29.53 0 0 0 73.91 71c.38.33.78.65 1.17 1H40a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16v64a16 16 0 0 0 16 16h144a16 16 0 0 0 16-16v-64a16 16 0 0 0 16-16V88a16 16 0 0 0-16-16m-67-35.49a13.7 13.7 0 0 1 10-4.5h.49A16.62 16.62 0 0 1 176 49.08a13.7 13.7 0 0 1-4.5 10c-9.49 8.4-25.24 11.36-35 12.4c1.2-10.59 4.5-25.98 12.5-34.97m-64.09.36A16.63 16.63 0 0 1 96.59 32h.49a13.7 13.7 0 0 1 10 4.5c8.39 9.48 11.35 25.2 12.39 34.92c-9.72-1-25.44-4-34.92-12.39a13.7 13.7 0 0 1-4.5-10a16.6 16.6 0 0 1 4.82-12.16ZM40 88h80v32H40Zm16 48h64v64H56Zm144 64h-64v-64h64Zm16-80h-80V88h80z\"/>";
/** gift */
export function IconGift({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_GIFT }} />;
}

const B_COINS = "<path fill=\"currentColor\" d=\"M184 89.57V84c0-25.08-37.83-44-88-44S8 58.92 8 84v40c0 20.89 26.25 37.49 64 42.46V172c0 25.08 37.83 44 88 44s88-18.92 88-44v-40c0-20.7-25.42-37.32-64-42.43M232 132c0 13.22-30.79 28-72 28c-3.73 0-7.43-.13-11.08-.37C170.49 151.77 184 139 184 124v-18.26c29.87 4.45 48 16.53 48 26.26M72 150.25v-23.79A184 184 0 0 0 96 128a184 184 0 0 0 24-1.54v23.79A163 163 0 0 1 96 152a163 163 0 0 1-24-1.75m96-40.32V124c0 8.39-12.41 17.4-32 22.87V123.5c12.91-3.13 23.84-7.79 32-13.57M96 56c41.21 0 72 14.78 72 28s-30.79 28-72 28s-72-14.78-72-28s30.79-28 72-28m-72 68v-14.07c8.16 5.78 19.09 10.44 32 13.57v23.37C36.41 141.4 24 132.39 24 124m64 48v-4.17c2.63.1 5.29.17 8 .17c3.88 0 7.67-.13 11.39-.35a122 122 0 0 0 12.61 3.76v23.46c-19.59-5.47-32-14.48-32-22.87m48 26.25V174.4a179.5 179.5 0 0 0 24 1.6a184 184 0 0 0 24-1.54v23.79a165.5 165.5 0 0 1-48 0m64-3.38V171.5c12.91-3.13 23.84-7.79 32-13.57V172c0 8.39-12.41 17.4-32 22.87\"/>";
/** coins */
export function IconCoins({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_COINS }} />;
}

const B_LOCK_SIMPLE = "<path fill=\"currentColor\" d=\"M208 80h-32V56a48 48 0 0 0-96 0v24H48a16 16 0 0 0-16 16v112a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V96a16 16 0 0 0-16-16M96 56a32 32 0 0 1 64 0v24H96Zm112 152H48V96h160z\"/>";
/** lock-simple */
export function IconLockSimple({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_LOCK_SIMPLE }} />;
}

const B_EYE_SLASH = "<path fill=\"currentColor\" d=\"M53.92 34.62a8 8 0 1 0-11.84 10.76l19.24 21.17C25 88.84 9.38 123.2 8.69 124.76a8 8 0 0 0 0 6.5c.35.79 8.82 19.57 27.65 38.4C61.43 194.74 93.12 208 128 208a127.1 127.1 0 0 0 52.07-10.83l22 24.21a8 8 0 1 0 11.84-10.76Zm47.33 75.84l41.67 45.85a32 32 0 0 1-41.67-45.85M128 192c-30.78 0-57.67-11.19-79.93-33.25A133.2 133.2 0 0 1 25 128c4.69-8.79 19.66-33.39 47.35-49.38l18 19.75a48 48 0 0 0 63.66 70l14.73 16.2A112 112 0 0 1 128 192m6-95.43a8 8 0 0 1 3-15.72a48.16 48.16 0 0 1 38.77 42.64a8 8 0 0 1-7.22 8.71a6 6 0 0 1-.75 0a8 8 0 0 1-8-7.26A32.09 32.09 0 0 0 134 96.57m113.28 34.69c-.42.94-10.55 23.37-33.36 43.8a8 8 0 1 1-10.67-11.92a132.8 132.8 0 0 0 27.8-35.14a133.2 133.2 0 0 0-23.12-30.77C185.67 75.19 158.78 64 128 64a118.4 118.4 0 0 0-19.36 1.57A8 8 0 1 1 106 49.79A134 134 0 0 1 128 48c34.88 0 66.57 13.26 91.66 38.35c18.83 18.83 27.3 37.62 27.65 38.41a8 8 0 0 1 0 6.5Z\"/>";
/** eye-slash */
export function IconEyeSlash({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_EYE_SLASH }} />;
}

const B_CLOUD_SLASH = "<path fill=\"currentColor\" d=\"M53.92 34.62a8 8 0 1 0-11.84 10.76l39.24 43.17l-.06.12A65 65 0 0 0 72 88a64 64 0 0 0 0 128h88a87.3 87.3 0 0 0 31.8-5.93l10.28 11.31a8 8 0 1 0 11.84-10.76ZM160 200H72a48 48 0 0 1 0-96c1.1 0 2.2 0 3.3.12A88.4 88.4 0 0 0 72 128a8 8 0 0 0 16 0a72.3 72.3 0 0 1 5.06-26.54l87 95.7A71.7 71.7 0 0 1 160 200m88-72a87.9 87.9 0 0 1-22.35 58.61A8 8 0 0 1 213.71 176a72 72 0 0 0-96.34-106a8 8 0 0 1-9.48-12.89A88 88 0 0 1 248 128\"/>";
/** cloud-slash */
export function IconCloudSlash({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_CLOUD_SLASH }} />;
}

const B_WIFI_SLASH = "<path fill=\"currentColor\" d=\"M213.92 210.62a8 8 0 1 1-11.84 10.76l-52-57.15a60 60 0 0 0-57.41 7.24a8 8 0 1 1-9.42-12.93A75.43 75.43 0 0 1 128 144c1.28 0 2.55 0 3.82.1l-26.92-29.61A108 108 0 0 0 61 135.31A8 8 0 0 1 49.73 134A8 8 0 0 1 51 122.77a124.3 124.3 0 0 1 41.71-21.66L69.37 75.4a155.4 155.4 0 0 0-40.29 24A8 8 0 0 1 18.92 87A172 172 0 0 1 58 62.86L42.08 45.38a8 8 0 1 1 11.84-10.76ZM128 192a12 12 0 1 0 12 12a12 12 0 0 0-12-12M237.08 87A172.3 172.3 0 0 0 106 49.4a8 8 0 1 0 2 15.87A158 158 0 0 1 128 64a156.25 156.25 0 0 1 98.92 35.37A8 8 0 0 0 237.08 87M195 135.31a8 8 0 0 0 11.24-1.3a8 8 0 0 0-1.3-11.24a124.25 124.25 0 0 0-51.73-24.2a8 8 0 1 0-3.21 15.67a108.1 108.1 0 0 1 45 21.07\"/>";
/** wifi-slash */
export function IconWifiSlash({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_WIFI_SLASH }} />;
}

const B_CLOUD_CHECK = "<path fill=\"currentColor\" d=\"M160 40a88.09 88.09 0 0 0-78.71 48.67A64 64 0 1 0 72 216h88a88 88 0 0 0 0-176m0 160H72a48 48 0 0 1 0-96c1.1 0 2.2 0 3.29.11A88 88 0 0 0 72 128a8 8 0 0 0 16 0a72 72 0 1 1 72 72m37.66-93.66a8 8 0 0 1 0 11.32l-48 48a8 8 0 0 1-11.32 0l-24-24a8 8 0 0 1 11.32-11.32L144 148.69l42.34-42.35a8 8 0 0 1 11.32 0\"/>";
/** cloud-check */
export function IconCloudCheck({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_CLOUD_CHECK }} />;
}

const B_FILE_ARROW_DOWN = "<path fill=\"currentColor\" d=\"m213.66 82.34l-56-56A8 8 0 0 0 152 24H56a16 16 0 0 0-16 16v176a16 16 0 0 0 16 16h144a16 16 0 0 0 16-16V88a8 8 0 0 0-2.34-5.66M160 51.31L188.69 80H160ZM200 216H56V40h88v48a8 8 0 0 0 8 8h48zm-42.34-61.66a8 8 0 0 1 0 11.32l-24 24a8 8 0 0 1-11.32 0l-24-24a8 8 0 0 1 11.32-11.32L120 164.69V120a8 8 0 0 1 16 0v44.69l10.34-10.35a8 8 0 0 1 11.32 0\"/>";
/** file-arrow-down */
export function IconFileArrowDown({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_FILE_ARROW_DOWN }} />;
}

const B_FILE_ARROW_UP = "<path fill=\"currentColor\" d=\"m213.66 82.34l-56-56A8 8 0 0 0 152 24H56a16 16 0 0 0-16 16v176a16 16 0 0 0 16 16h144a16 16 0 0 0 16-16V88a8 8 0 0 0-2.34-5.66M160 51.31L188.69 80H160ZM200 216H56V40h88v48a8 8 0 0 0 8 8h48zm-42.34-77.66a8 8 0 0 1-11.32 11.32L136 139.31V184a8 8 0 0 1-16 0v-44.69l-10.34 10.35a8 8 0 0 1-11.32-11.32l24-24a8 8 0 0 1 11.32 0Z\"/>";
/** file-arrow-up */
export function IconFileArrowUp({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_FILE_ARROW_UP }} />;
}

const B_BUILDINGS = "<path fill=\"currentColor\" d=\"M240 208h-16V96a16 16 0 0 0-16-16h-64V32a16 16 0 0 0-24.88-13.32L39.12 72A16 16 0 0 0 32 85.34V208H16a8 8 0 0 0 0 16h224a8 8 0 0 0 0-16M208 96v112h-64V96ZM48 85.34L128 32v176H48ZM112 112v16a8 8 0 0 1-16 0v-16a8 8 0 1 1 16 0m-32 0v16a8 8 0 0 1-16 0v-16a8 8 0 1 1 16 0m0 56v16a8 8 0 0 1-16 0v-16a8 8 0 0 1 16 0m32 0v16a8 8 0 0 1-16 0v-16a8 8 0 0 1 16 0\"/>";
/** buildings */
export function IconBuildings({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_BUILDINGS }} />;
}

const B_KEY = "<path fill=\"currentColor\" d=\"M216.57 39.43a80 80 0 0 0-132.66 81.35L28.69 176A15.86 15.86 0 0 0 24 187.31V216a16 16 0 0 0 16 16h32a8 8 0 0 0 8-8v-16h16a8 8 0 0 0 8-8v-16h16a8 8 0 0 0 5.66-2.34l9.56-9.57A79.7 79.7 0 0 0 160 176h.1a80 80 0 0 0 56.47-136.57M224 98.1c-1.09 34.09-29.75 61.86-63.89 61.9H160a63.7 63.7 0 0 1-23.65-4.51a8 8 0 0 0-8.84 1.68L116.69 168H96a8 8 0 0 0-8 8v16H72a8 8 0 0 0-8 8v16H40v-28.69l58.83-58.82a8 8 0 0 0 1.68-8.84A63.7 63.7 0 0 1 96 95.92c0-34.14 27.81-62.8 61.9-63.89A64 64 0 0 1 224 98.1M192 76a12 12 0 1 1-12-12a12 12 0 0 1 12 12\"/>";
/** key */
export function IconKey({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_KEY }} />;
}

const B_BANK = "<path fill=\"currentColor\" d=\"M24 104h24v64H32a8 8 0 0 0 0 16h192a8 8 0 0 0 0-16h-16v-64h24a8 8 0 0 0 4.19-14.81l-104-64a8 8 0 0 0-8.38 0l-104 64A8 8 0 0 0 24 104m40 0h32v64H64Zm80 0v64h-32v-64Zm48 64h-32v-64h32ZM128 41.39L203.74 88H52.26ZM248 208a8 8 0 0 1-8 8H16a8 8 0 0 1 0-16h224a8 8 0 0 1 8 8\"/>";
/** bank */
export function IconBank({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_BANK }} />;
}

const B_TABLE = "<path fill=\"currentColor\" d=\"M224 48H32a8 8 0 0 0-8 8v136a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V56a8 8 0 0 0-8-8M40 112h40v32H40Zm56 0h120v32H96Zm120-48v32H40V64ZM40 160h40v32H40Zm176 32H96v-32h120z\"/>";
/** table */
export function IconTable({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_TABLE }} />;
}

const B_CHART_BAR = "<path fill=\"currentColor\" d=\"M224 200h-8V40a8 8 0 0 0-8-8h-56a8 8 0 0 0-8 8v40H96a8 8 0 0 0-8 8v40H48a8 8 0 0 0-8 8v64h-8a8 8 0 0 0 0 16h192a8 8 0 0 0 0-16M160 48h40v152h-40Zm-56 48h40v104h-40Zm-48 48h32v56H56Z\"/>";
/** chart-bar */
export function IconChartBar({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_CHART_BAR }} />;
}

const B_SPEAKER_HIGH = "<path fill=\"currentColor\" d=\"M155.51 24.81a8 8 0 0 0-8.42.88L77.25 80H32a16 16 0 0 0-16 16v64a16 16 0 0 0 16 16h45.25l69.84 54.31A8 8 0 0 0 160 224V32a8 8 0 0 0-4.49-7.19M32 96h40v64H32Zm112 111.64l-56-43.55V91.91l56-43.55Zm54-106.08a40 40 0 0 1 0 52.88a8 8 0 0 1-12-10.58a24 24 0 0 0 0-31.72a8 8 0 0 1 12-10.58M248 128a79.9 79.9 0 0 1-20.37 53.34a8 8 0 0 1-11.92-10.67a64 64 0 0 0 0-85.33a8 8 0 1 1 11.92-10.67A79.83 79.83 0 0 1 248 128\"/>";
/** speaker-high */
export function IconSpeakerHigh({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_SPEAKER_HIGH }} />;
}

const B_CHAT_CIRCLE = "<path fill=\"currentColor\" d=\"M128 24a104 104 0 0 0-91.82 152.88l-11.35 34.05a16 16 0 0 0 20.24 20.24l34.05-11.35A104 104 0 1 0 128 24m0 192a87.87 87.87 0 0 1-44.06-11.81a8 8 0 0 0-6.54-.67L40 216l12.47-37.4a8 8 0 0 0-.66-6.54A88 88 0 1 1 128 216\"/>";
/** chat-circle */
export function IconChatCircle({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_CHAT_CIRCLE }} />;
}

const B_USERS = "<path fill=\"currentColor\" d=\"M117.25 157.92a60 60 0 1 0-66.5 0a95.83 95.83 0 0 0-47.22 37.71a8 8 0 1 0 13.4 8.74a80 80 0 0 1 134.14 0a8 8 0 0 0 13.4-8.74a95.83 95.83 0 0 0-47.22-37.71M40 108a44 44 0 1 1 44 44a44.05 44.05 0 0 1-44-44m210.14 98.7a8 8 0 0 1-11.07-2.33A79.83 79.83 0 0 0 172 168a8 8 0 0 1 0-16a44 44 0 1 0-16.34-84.87a8 8 0 1 1-5.94-14.85a60 60 0 0 1 55.53 105.64a95.83 95.83 0 0 1 47.22 37.71a8 8 0 0 1-2.33 11.07\"/>";
/** users */
export function IconUsers({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_USERS }} />;
}

const B_USER = "<path fill=\"currentColor\" d=\"M230.92 212c-15.23-26.33-38.7-45.21-66.09-54.16a72 72 0 1 0-73.66 0c-27.39 8.94-50.86 27.82-66.09 54.16a8 8 0 1 0 13.85 8c18.84-32.56 52.14-52 89.07-52s70.23 19.44 89.07 52a8 8 0 1 0 13.85-8M72 96a56 56 0 1 1 56 56a56.06 56.06 0 0 1-56-56\"/>";
/** user */
export function IconUser({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_USER }} />;
}

const B_SEAL_CHECK = "<path fill=\"currentColor\" d=\"M225.86 102.82c-3.77-3.94-7.67-8-9.14-11.57c-1.36-3.27-1.44-8.69-1.52-13.94c-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52c-3.56-1.47-7.63-5.37-11.57-9.14C146.28 23.51 138.44 16 128 16s-18.27 7.51-25.18 14.14c-3.94 3.77-8 7.67-11.57 9.14c-3.25 1.36-8.69 1.44-13.94 1.52c-9.76.15-20.82.31-28.51 8s-7.8 18.75-8 28.51c-.08 5.25-.16 10.67-1.52 13.94c-1.47 3.56-5.37 7.63-9.14 11.57C23.51 109.72 16 117.56 16 128s7.51 18.27 14.14 25.18c3.77 3.94 7.67 8 9.14 11.57c1.36 3.27 1.44 8.69 1.52 13.94c.15 9.76.31 20.82 8 28.51s18.75 7.85 28.51 8c5.25.08 10.67.16 13.94 1.52c3.56 1.47 7.63 5.37 11.57 9.14c6.9 6.63 14.74 14.14 25.18 14.14s18.27-7.51 25.18-14.14c3.94-3.77 8-7.67 11.57-9.14c3.27-1.36 8.69-1.44 13.94-1.52c9.76-.15 20.82-.31 28.51-8s7.85-18.75 8-28.51c.08-5.25.16-10.67 1.52-13.94c1.47-3.56 5.37-7.63 9.14-11.57c6.63-6.9 14.14-14.74 14.14-25.18s-7.51-18.27-14.14-25.18m-11.55 39.29c-4.79 5-9.75 10.17-12.38 16.52c-2.52 6.1-2.63 13.07-2.73 19.82c-.1 7-.21 14.33-3.32 17.43s-10.39 3.22-17.43 3.32c-6.75.1-13.72.21-19.82 2.73c-6.35 2.63-11.52 7.59-16.52 12.38S132 224 128 224s-9.15-4.92-14.11-9.69s-10.17-9.75-16.52-12.38c-6.1-2.52-13.07-2.63-19.82-2.73c-7-.1-14.33-.21-17.43-3.32s-3.22-10.39-3.32-17.43c-.1-6.75-.21-13.72-2.73-19.82c-2.63-6.35-7.59-11.52-12.38-16.52S32 132 32 128s4.92-9.15 9.69-14.11s9.75-10.17 12.38-16.52c2.52-6.1 2.63-13.07 2.73-19.82c.1-7 .21-14.33 3.32-17.43s10.39-3.22 17.43-3.32c6.75-.1 13.72-.21 19.82-2.73c6.35-2.63 11.52-7.59 16.52-12.38S124 32 128 32s9.15 4.92 14.11 9.69s10.17 9.75 16.52 12.38c6.1 2.52 13.07 2.63 19.82 2.73c7 .1 14.33.21 17.43 3.32s3.22 10.39 3.32 17.43c.1 6.75.21 13.72 2.73 19.82c2.63 6.35 7.59 11.52 12.38 16.52S224 124 224 128s-4.92 9.15-9.69 14.11m-40.65-43.77a8 8 0 0 1 0 11.32l-56 56a8 8 0 0 1-11.32 0l-24-24a8 8 0 0 1 11.32-11.32L112 148.69l50.34-50.35a8 8 0 0 1 11.32 0\"/>";
/** seal-check */
export function IconSealCheck({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_SEAL_CHECK }} />;
}

const B_LIGHTBULB = "<path fill=\"currentColor\" d=\"M176 232a8 8 0 0 1-8 8H88a8 8 0 0 1 0-16h80a8 8 0 0 1 8 8m40-128a87.55 87.55 0 0 1-33.64 69.21A16.24 16.24 0 0 0 176 186v6a16 16 0 0 1-16 16H96a16 16 0 0 1-16-16v-6a16 16 0 0 0-6.23-12.66A87.59 87.59 0 0 1 40 104.49C39.74 56.83 78.26 17.14 125.88 16A88 88 0 0 1 216 104m-16 0a72 72 0 0 0-73.74-72c-39 .92-70.47 33.39-70.26 72.39a71.65 71.65 0 0 0 27.64 56.3A32 32 0 0 1 96 186v6h64v-6a32.15 32.15 0 0 1 12.47-25.35A71.65 71.65 0 0 0 200 104m-16.11-9.34a57.6 57.6 0 0 0-46.56-46.55a8 8 0 0 0-2.66 15.78c16.57 2.79 30.63 16.85 33.44 33.45A8 8 0 0 0 176 104a9 9 0 0 0 1.35-.11a8 8 0 0 0 6.54-9.23\"/>";
/** lightbulb */
export function IconLightbulb({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_LIGHTBULB }} />;
}

const B_PATH = "<path fill=\"currentColor\" d=\"M200 168a32.06 32.06 0 0 0-31 24H72a32 32 0 0 1 0-64h96a40 40 0 0 0 0-80H72a8 8 0 0 0 0 16h96a24 24 0 0 1 0 48H72a48 48 0 0 0 0 96h97a32 32 0 1 0 31-40m0 48a16 16 0 1 1 16-16a16 16 0 0 1-16 16\"/>";
/** path */
export function IconPath({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_PATH }} />;
}

const B_DIAMOND = "<path fill=\"currentColor\" d=\"m235.33 116.72l-96.05-96.06a16 16 0 0 0-22.56 0l-96 96.06a16 16 0 0 0 0 22.56l96.05 96.06a16 16 0 0 0 22.56 0l96.05-96.06a16 16 0 0 0 0-22.56ZM128 224l-96-96l96-96l96 96Z\"/>";
/** diamond */
export function IconDiamond({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_DIAMOND }} />;
}

const B_FRAME_CORNERS = "<path fill=\"currentColor\" d=\"M200 80v32a8 8 0 0 1-16 0V88h-24a8 8 0 0 1 0-16h32a8 8 0 0 1 8 8M96 168H72v-24a8 8 0 0 0-16 0v32a8 8 0 0 0 8 8h32a8 8 0 0 0 0-16M232 56v144a16 16 0 0 1-16 16H40a16 16 0 0 1-16-16V56a16 16 0 0 1 16-16h176a16 16 0 0 1 16 16m-16 144V56H40v144z\"/>";
/** frame-corners */
export function IconFrameCorners({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_FRAME_CORNERS }} />;
}

const B_FLAG_BANNER = "<path fill=\"currentColor\" d=\"M238.76 51.73A8 8 0 0 0 232 48H40a8 8 0 0 0-5.66 13.66L76.69 104l-42.35 42.34A8 8 0 0 0 40 160h133.62l-28.84 60.56a8 8 0 1 0 14.44 6.88l80-168a8 8 0 0 0-.46-7.71M181.23 144H59.31l34.35-34.34a8 8 0 0 0 0-11.32L59.31 64h160Z\"/>";
/** flag-banner */
export function IconFlagBanner({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_FLAG_BANNER }} />;
}

const B_SUN = "<path fill=\"currentColor\" d=\"M120 40V16a8 8 0 0 1 16 0v24a8 8 0 0 1-16 0m72 88a64 64 0 1 1-64-64a64.07 64.07 0 0 1 64 64m-16 0a48 48 0 1 0-48 48a48.05 48.05 0 0 0 48-48M58.34 69.66a8 8 0 0 0 11.32-11.32l-16-16a8 8 0 0 0-11.32 11.32Zm0 116.68l-16 16a8 8 0 0 0 11.32 11.32l16-16a8 8 0 0 0-11.32-11.32M192 72a8 8 0 0 0 5.66-2.34l16-16a8 8 0 0 0-11.32-11.32l-16 16A8 8 0 0 0 192 72m5.66 114.34a8 8 0 0 0-11.32 11.32l16 16a8 8 0 0 0 11.32-11.32ZM48 128a8 8 0 0 0-8-8H16a8 8 0 0 0 0 16h24a8 8 0 0 0 8-8m80 80a8 8 0 0 0-8 8v24a8 8 0 0 0 16 0v-24a8 8 0 0 0-8-8m112-88h-24a8 8 0 0 0 0 16h24a8 8 0 0 0 0-16\"/>";
/** sun */
export function IconSun({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_SUN }} />;
}

const B_MOON = "<path fill=\"currentColor\" d=\"M233.54 142.23a8 8 0 0 0-8-2a88.08 88.08 0 0 1-109.8-109.8a8 8 0 0 0-10-10a104.84 104.84 0 0 0-52.91 37A104 104 0 0 0 136 224a103.1 103.1 0 0 0 62.52-20.88a104.84 104.84 0 0 0 37-52.91a8 8 0 0 0-1.98-7.98m-44.64 48.11A88 88 0 0 1 65.66 67.11a89 89 0 0 1 31.4-26A106 106 0 0 0 96 56a104.11 104.11 0 0 0 104 104a106 106 0 0 0 14.92-1.06a89 89 0 0 1-26.02 31.4\"/>";
/** moon */
export function IconMoon({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_MOON }} />;
}

const B_TREE = "<path fill=\"currentColor\" d=\"M198.1 62.59a76 76 0 0 0-140.2 0A71.71 71.71 0 0 0 16 127.8C15.9 166 48 199 86.14 200a72.1 72.1 0 0 0 33.86-7.53V232a8 8 0 0 0 16 0v-39.53a72.2 72.2 0 0 0 32 7.53h1.82c38.18-1 70.29-34 70.18-72.2a71.71 71.71 0 0 0-41.9-65.21M169.45 184A56.08 56.08 0 0 1 136 174v-41l43.58-21.78a8 8 0 1 0-7.16-14.32L136 115.06V88a8 8 0 0 0-16 0v51.06l-36.42-18.22a8 8 0 1 0-7.16 14.32L120 156.94v17a56 56 0 0 1-33.45 10c-29.65-.71-54.63-26.42-54.55-56.1A55.77 55.77 0 0 1 67.11 76a8 8 0 0 0 4.53-4.67a60 60 0 0 1 112.72 0a8 8 0 0 0 4.53 4.67A55.79 55.79 0 0 1 224 127.84c.08 29.68-24.9 55.39-54.55 56.16\"/>";
/** tree */
export function IconTree({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_TREE }} />;
}

const B_TREE_PALM = "<path fill=\"currentColor\" d=\"M237.79 53.23a66.86 66.86 0 0 0-97.74 0a72.2 72.2 0 0 0-12.05 17a72.2 72.2 0 0 0-12-17a66.86 66.86 0 0 0-97.74 0a8 8 0 0 0 2.6 12.85L77 90.55a71.42 71.42 0 0 0-43.36 33.21a70.64 70.64 0 0 0-7.2 54.32A8 8 0 0 0 39 182.36l81-61.68V224a8 8 0 0 0 16 0V120.68l81 61.68a8 8 0 0 0 12.57-4.28a70.64 70.64 0 0 0-7.2-54.32A71.42 71.42 0 0 0 179 90.55l56.22-24.47a8 8 0 0 0 2.6-12.85ZM67.08 48a51.13 51.13 0 0 1 37.28 16.26a56.53 56.53 0 0 1 14.26 26.93L39 56.53A50.5 50.5 0 0 1 67.08 48M40 161.5a54.8 54.8 0 0 1 7.47-29.7a55.55 55.55 0 0 1 34-25.89A56.5 56.5 0 0 1 96.1 104a55.8 55.8 0 0 1 16.23 2.41Zm168.5-29.7a54.8 54.8 0 0 1 7.5 29.7l-72.3-55.1a56.3 56.3 0 0 1 64.83 25.4Zm-71.12-40.61a56.53 56.53 0 0 1 14.26-26.93A51.13 51.13 0 0 1 188.92 48A50.5 50.5 0 0 1 217 56.53Z\"/>";
/** tree-palm */
export function IconTreePalm({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_TREE_PALM }} />;
}

const B_LEAF = "<path fill=\"currentColor\" d=\"M223.45 40.07a8 8 0 0 0-7.52-7.52C139.8 28.08 78.82 51 52.82 94a87.1 87.1 0 0 0-12.76 49c.57 15.92 5.21 32 13.79 47.85l-19.51 19.5a8 8 0 0 0 11.32 11.32l19.5-19.51C81 210.73 97.09 215.37 113 215.94q1.67.06 3.33.06A86.93 86.93 0 0 0 162 203.18c43-26 65.93-86.97 61.45-163.11m-69.7 149.43c-22.75 13.78-49.68 14-76.71.77l88.63-88.62a8 8 0 0 0-11.32-11.32L65.73 179c-13.19-27-13-54 .77-76.71c22.09-36.47 74.6-56.44 141.31-54.06c2.39 66.66-17.59 119.18-54.06 141.27\"/>";
/** leaf */
export function IconLeaf({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_LEAF }} />;
}

const B_PLANT = "<path fill=\"currentColor\" d=\"M247.63 47.89a8 8 0 0 0-7.52-7.52c-51.76-3-93.32 12.74-111.18 42.22c-11.8 19.49-11.78 43.16-.16 65.74a71.3 71.3 0 0 0-14.17 27L98.33 159c7.82-16.33 7.52-33.35-1-47.49c-13.2-21.79-43.67-33.47-81.5-31.25a8 8 0 0 0-7.52 7.52c-2.23 37.83 9.46 68.3 31.25 81.5A45.8 45.8 0 0 0 63.44 176A54.6 54.6 0 0 0 87 170.33l25 25V224a8 8 0 0 0 16 0v-29.49a55.6 55.6 0 0 1 12.27-35a73.9 73.9 0 0 0 33.31 8.4a60.9 60.9 0 0 0 31.83-8.86c29.48-17.84 45.26-59.4 42.22-111.16M47.81 155.6C32.47 146.31 23.79 124.32 24 96c28.32-.24 50.31 8.47 59.6 23.81c4.85 8 5.64 17.33 2.46 26.94l-24.41-24.41a8 8 0 0 0-11.31 11.31l24.41 24.41c-9.61 3.18-18.93 2.39-26.94-2.46m149.31-10.22c-13.4 8.11-29.15 8.73-45.15 2l53.69-53.7a8 8 0 0 0-11.31-11.31L140.65 136c-6.76-16-6.15-31.76 2-45.15c13.94-23 47-35.82 89.33-34.83c.96 42.32-11.84 75.42-34.86 89.36\"/>";
/** plant */
export function IconPlant({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_PLANT }} />;
}

const B_USER_PLUS = "<path fill=\"currentColor\" d=\"M256 136a8 8 0 0 1-8 8h-16v16a8 8 0 0 1-16 0v-16h-16a8 8 0 0 1 0-16h16v-16a8 8 0 0 1 16 0v16h16a8 8 0 0 1 8 8m-57.87 58.85a8 8 0 0 1-12.26 10.3C165.75 181.19 138.09 168 108 168s-57.75 13.19-77.87 37.15a8 8 0 0 1-12.25-10.3c14.94-17.78 33.52-30.41 54.17-37.17a68 68 0 1 1 71.9 0c20.65 6.76 39.23 19.39 54.18 37.17M108 152a52 52 0 1 0-52-52a52.06 52.06 0 0 0 52 52\"/>";
/** user-plus */
export function IconUserPlus({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_USER_PLUS }} />;
}

const B_CAMERA = "<path fill=\"currentColor\" d=\"M208 56h-27.72l-13.63-20.44A8 8 0 0 0 160 32H96a8 8 0 0 0-6.65 3.56L75.71 56H48a24 24 0 0 0-24 24v112a24 24 0 0 0 24 24h160a24 24 0 0 0 24-24V80a24 24 0 0 0-24-24m8 136a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8V80a8 8 0 0 1 8-8h32a8 8 0 0 0 6.66-3.56L100.28 48h55.43l13.63 20.44A8 8 0 0 0 176 72h32a8 8 0 0 1 8 8ZM128 88a44 44 0 1 0 44 44a44.05 44.05 0 0 0-44-44m0 72a28 28 0 1 1 28-28a28 28 0 0 1-28 28\"/>";
/** camera */
export function IconCamera({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_CAMERA }} />;
}

const B_AMAMI_KUROUSAGI = "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"16\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M71 207.8H186.9C202.1 207.8 208.8 197.4 205 186.9C203.1 179.3 198.3 173.6 192.6 169.8C211.6 164.1 223 150.8 223 135.6C223 107.1 205.9 88.1 181.2 83.4C179.3 67.2 170.8 57.7 159.4 57.7C148 57.7 141.3 67.2 142.3 80.5C99.5 78.6 44.4 101.4 34.9 145.1C27.3 181.2 42.5 207.8 71 207.8Z\"/><path d=\"M129.9 207.8C131.8 175.5 112.8 152.7 84.3 156.5\"/><circle cx=\"187.9\" cy=\"121.4\" r=\"11.4\" fill=\"currentColor\" stroke=\"none\"/></g>";
/** amami:kurousagi */
export function IconAmamiKurousagi({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_AMAMI_KUROUSAGI }} />;
}

const B_AMAMI_KUROUSAGI_FILL = "<g fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"16\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path fill-rule=\"evenodd\" d=\"M71 207.8H186.9C202.1 207.8 208.8 197.4 205 186.9C203.1 179.3 198.3 173.6 192.6 169.8C211.6 164.1 223 150.8 223 135.6C223 107.1 205.9 88.1 181.2 83.4C179.3 67.2 170.8 57.7 159.4 57.7C148 57.7 141.3 67.2 142.3 80.5C99.5 78.6 44.4 101.4 34.9 145.1C27.3 181.2 42.5 207.8 71 207.8ZM168.9 121.4a19 19 0 1 0 38 0a19 19 0 1 0 -38 0ZM142.9 195.3L142.2 189.5L140.9 183.9L139.2 178.4L137.1 173.2L134.6 168.4L131.6 163.7L128.2 159.5L124.4 155.6L120.1 152.2L115.6 149.3L110.6 146.8L105.4 144.9L100 143.6L94.3 142.9L88.5 142.8L82.6 143.3L86 169.7L89.3 169.4L92.4 169.4L95.2 169.8L97.8 170.5L100.3 171.3L102.4 172.4L104.5 173.7L106.5 175.3L108.3 177.2L110 179.3L111.6 181.7L113 184.4L114.1 187.4L115.2 190.6L115.9 194.1L116.5 197.9Z\"/></g>";
/** amami:kurousagi-fill */
export function IconAmamiKurousagiFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_AMAMI_KUROUSAGI_FILL }} />;
}

const B_AMAMI_FROG = "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"16\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M133.5 83.8A25.5 25.5 0 1 1 181.3 83.8C194.6 92.7 198.6 112.3 190.7 131.9C184.8 159.4 163.3 196.6 128 196.6C92.7 196.6 71.2 159.4 65.3 131.9C57.4 112.3 61.4 92.7 74.7 83.8A25.5 25.5 0 1 1 122.5 83.8Q128 88.8 133.5 83.8Z\"/><path d=\"M67.2 131.9L41.8 135.8L35.9 104.5\"/><path d=\"M188.8 131.9L214.2 135.8L220.1 104.5\"/><path d=\"M84.9 180.9L41.8 167.2L53.5 212.3L32 220.1\"/><path d=\"M171.1 180.9L214.2 167.2L202.5 212.3L224 220.1\"/><circle cx=\"98.6\" cy=\"75.1\" r=\"9.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"157.4\" cy=\"75.1\" r=\"9.8\" fill=\"currentColor\" stroke=\"none\"/></g>";
/** amami:frog */
export function IconAmamiFrog({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_AMAMI_FROG }} />;
}

const B_AMAMI_FROG_FILL = "<g fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"16\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path fill-rule=\"evenodd\" d=\"M133.5 83.8A25.5 25.5 0 1 1 181.3 83.8C194.6 92.7 198.6 112.3 190.7 131.9C184.8 159.4 163.3 196.6 128 196.6C92.7 196.6 71.2 159.4 65.3 131.9C57.4 112.3 61.4 92.7 74.7 83.8A25.5 25.5 0 1 1 122.5 83.8Q128 88.8 133.5 83.8ZM81 75.1a17.6 17.6 0 1 0 35.3 0a17.6 17.6 0 1 0 -35.3 0ZM139.8 75.1a17.6 17.6 0 1 0 35.3 0a17.6 17.6 0 1 0 -35.3 0Z\"/><path fill=\"none\" d=\"M67.2 131.9L41.8 135.8L35.9 104.5\"/><path fill=\"none\" d=\"M188.8 131.9L214.2 135.8L220.1 104.5\"/><path fill=\"none\" d=\"M84.9 180.9L41.8 167.2L53.5 212.3L32 220.1\"/><path fill=\"none\" d=\"M171.1 180.9L214.2 167.2L202.5 212.3L224 220.1\"/></g>";
/** amami:frog-fill */
export function IconAmamiFrogFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_AMAMI_FROG_FILL }} />;
}

const B_AMAMI_FERN = "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"16\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M128 222V113\"/><path d=\"M128 113Q126.1 92.3 126.6 86.6\"/><path d=\"M128 113Q109.2 82.9 102.4 81.6\"/><path d=\"M128 113Q146.8 82.9 153.6 81.6\"/><path d=\"M128 113Q94.2 103.6 89.1 109\"/><path d=\"M128 113Q161.8 103.6 166.9 109\"/><path d=\"M137.9 86.5Q152.1 70.8 135.3 59.7Q145.5 44.7 129.9 32.1Q111.6 41.1 119 58.7Q101.2 69.4 115.3 86.9Z\"/><path d=\"M110 73.2Q96.2 46.5 74.1 56Q51.9 43.9 37.8 62.2Q51.8 78 69.4 71.7Q72.7 91.5 94.9 90Z\"/><path d=\"M161.1 90Q183.3 91.5 186.6 71.7Q204.2 78 218.2 62.2Q204.1 43.9 181.9 56Q159.8 46.5 146 73.2Z\"/><path d=\"M87.8 97.8Q57.5 92.2 52.2 116.3Q28.8 130.5 35.9 154.3Q57.9 148.3 62.8 128.8Q80.3 137.7 90.5 120.2Z\"/><path d=\"M165.5 120.2Q175.7 137.7 193.2 128.8Q198.1 148.3 220.1 154.3Q227.2 130.5 203.8 116.3Q198.5 92.2 168.2 97.8Z\"/></g>";
/** amami:fern */
export function IconAmamiFern({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_AMAMI_FERN }} />;
}

const B_AMAMI_FERN_FILL = "<g fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"16\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path fill=\"none\" d=\"M128 222V113\"/><path fill=\"none\" d=\"M128 113Q126.1 92.3 126.6 86.6\"/><path fill=\"none\" d=\"M128 113Q109.2 82.9 102.4 81.6\"/><path fill=\"none\" d=\"M128 113Q146.8 82.9 153.6 81.6\"/><path fill=\"none\" d=\"M128 113Q94.2 103.6 89.1 109\"/><path fill=\"none\" d=\"M128 113Q161.8 103.6 166.9 109\"/><path d=\"M137.9 86.5Q152.1 70.8 135.3 59.7Q145.5 44.7 129.9 32.1Q111.6 41.1 119 58.7Q101.2 69.4 115.3 86.9Z\"/><path d=\"M110 73.2Q96.2 46.5 74.1 56Q51.9 43.9 37.8 62.2Q51.8 78 69.4 71.7Q72.7 91.5 94.9 90Z\"/><path d=\"M161.1 90Q183.3 91.5 186.6 71.7Q204.2 78 218.2 62.2Q204.1 43.9 181.9 56Q159.8 46.5 146 73.2Z\"/><path d=\"M87.8 97.8Q57.5 92.2 52.2 116.3Q28.8 130.5 35.9 154.3Q57.9 148.3 62.8 128.8Q80.3 137.7 90.5 120.2Z\"/><path d=\"M165.5 120.2Q175.7 137.7 193.2 128.8Q198.1 148.3 220.1 154.3Q227.2 130.5 203.8 116.3Q198.5 92.2 168.2 97.8Z\"/></g>";
/** amami:fern-fill */
export function IconAmamiFernFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_AMAMI_FERN_FILL }} />;
}

const B_AMAMI_KAYAK = "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"16\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M32.3 128C61.8 179.5 194.2 179.5 223.7 128C190.6 128 161.1 124.3 150.1 120.6C144.6 113.3 111.4 113.3 105.9 120.6C94.9 124.3 65.4 128 32.3 128Z\"/><path d=\"M99.2 78L115.6 102.2\"/><path d=\"M74.5 41.3C63.8 48.5 88.5 85.1 99.2 78C109.9 70.7 85.2 34.2 74.5 41.3Z\"/><path d=\"M164 174C153.3 181.3 178 217.9 188.7 210.6C199.4 203.4 174.7 166.8 164 174Z\"/></g>";
/** amami:kayak */
export function IconAmamiKayak({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_AMAMI_KAYAK }} />;
}

const B_AMAMI_KAYAK_FILL = "<g fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"16\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M32.3 128C61.8 179.5 194.2 179.5 223.7 128C190.6 128 161.1 124.3 150.1 120.6C144.6 113.3 111.4 113.3 105.9 120.6C94.9 124.3 65.4 128 32.3 128Z\"/><path fill=\"none\" d=\"M99.2 78L115.6 102.2\"/><path d=\"M74.5 41.3C63.8 48.5 88.5 85.1 99.2 78C109.9 70.7 85.2 34.2 74.5 41.3Z\"/><path d=\"M164 174C153.3 181.3 178 217.9 188.7 210.6C199.4 203.4 174.7 166.8 164 174Z\"/></g>";
/** amami:kayak-fill */
export function IconAmamiKayakFill({ size = 24, ...p }: IconProps) {
  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: B_AMAMI_KAYAK_FILL }} />;
}
