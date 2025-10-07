
import {
  FC,
  PropsWithChildren,
} from 'hono/jsx';

export interface FrameOpts {
  title: string;
  styles?: string[];
  scripts?: string[];
}

export const Frame: FC<PropsWithChildren<FrameOpts>> = (props) => {
  return (
	  <html lang="en">
	    <head>
        <link href={`/assets/fonts/atkinson-hyperlegible-next/fontface.css`} rel="stylesheet" />
        <link href={`/assets/fonts/atkinson-hyperlegible-mono/fontface.css`} rel="stylesheet" />
        <link href={`/assets/fonts/b612/fontface.css`} rel="stylesheet" />
        <link href={`/assets/fonts/b612-mono/fontface.css`} rel="stylesheet" />
        <link href={`/assets/styles/dist/main.css`} rel="stylesheet" />
        {props.styles?.map(s => (<link href={s} rel="stylesheet" />))}
        <title>{props.title}</title>
        <script src="/assets/scripts/iframe.js"></script>
	    </head>
	    <body>
        { props.children }
        {props.scripts?.map(s => (<script src={s}></script>))}
     </body>
   </html>
  );
};


export interface IFramedFrameOpts {
  autohide?: false | number;
}

export const IFramedFrame: FC<PropsWithChildren<IFramedFrameOpts>> = (props) => {
  const { autohide, children } = props;
  return (
    <html lang="en">
      <head>
        { autohide && (<meta http-equiv="refresh" content={`${autohide}; url=/null_page?b=${Date.now()}`} />) }
      </head>
      <body>
        { children }
      </body>
    </html>
  );
};
