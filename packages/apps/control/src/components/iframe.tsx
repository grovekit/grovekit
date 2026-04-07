
import { CSSProperties, FC, PropsWithChildren } from "hono/jsx";

interface IframeProps {
  src?: string;
  name?: string;
  style?: CSSProperties;
  onload?: string;
  className?: string;
}

export const Iframe: FC<IframeProps> = (props) => {
  const { src = '/null_page', name, style, className = '' } = props;
  return (<iframe
    class={`q-iframe ${className}`}
    src={src}
    name={name}
    style={style}
    onload="qResizeIframe(this)"
  />);
};

interface AutoResizingIframeProps {
  src?: string;
  name?: string;
  style?: CSSProperties;
  className?: string;
}

/**
 *
 */
export const IframeModal: FC<AutoResizingIframeProps> = (props) => {
  const { src, name, style, className = '' } = props;
  return (<Iframe
    className={`q-iframe-modal ${className}`}
    src={src}
    name={name}
    style={style}
  />);
};

export interface IframeModalPageOpts {
  autohide?: false | number;
  parent_redirect?: URL;
}

export const IframeModalPage: FC<PropsWithChildren<IframeModalPageOpts>> = (props) => {
  const { autohide, children, parent_redirect } = props;
  return (
    <html class="q-iframe-modal-page" lang="en">
      <head>
        <link href={`/assets/fonts/atkinson-hyperlegible-next/fontface.css`} rel="stylesheet" />
        <link href={`/assets/fonts/atkinson-hyperlegible-mono/fontface.css`} rel="stylesheet" />
        <link href={`/assets/fonts/b612/fontface.css`} rel="stylesheet" />
        <link href={`/assets/fonts/b612-mono/fontface.css`} rel="stylesheet" />
        <link href={`/assets/styles.css`} rel="stylesheet" />
        { autohide && (
          <meta http-equiv="refresh" content={`${autohide}; url=/null_page?b=${Date.now()}`} />
        ) }
        {parent_redirect && (
          <script dangerouslySetInnerHTML={{
            __html: `window.parent.location.href = "${parent_redirect.toString()}";`
          }} />
        ) }
      </head>
      <body class="q-iframe-modal-page">
        { !parent_redirect && (
          <div class="q-iframe-modal-page-frame">
            <div class="q-iframe-modal-page-close">
              <a href="/null_page">Close</a>
            </div>
            { children }
          </div>
        ) }
      </body>
    </html>
  );
};
