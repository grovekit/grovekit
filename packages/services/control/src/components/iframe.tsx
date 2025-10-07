
import { CSSProperties, FC } from "hono/jsx";

interface AutoResizingIframeProps {
  src?: string;
  name?: string;
  style?: CSSProperties;
}

/**
 * This components is mainly used as a local form target. A form with the
 * `target` attribute set to the value of the `name` prop will cause the
 * request to happen within the iframe, preventing the loading of an entire
 * new page.
 */
export const AutoResizingIframe: FC<AutoResizingIframeProps> = (props) => {
  const { src = '/null_page', name, style = {} } = props;
  return (<iframe src={src} name={name} style={{ border: 0, width: '100%', height: '0px', ...style }} onload="qResizeIframe(this)" />);
};
