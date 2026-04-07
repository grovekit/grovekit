
import {
  FC,
  PropsWithChildren,
} from 'hono/jsx';

export interface FrameOpts {
  title: string;
  styles?: string[];
  scripts?: string[];
  refresh?: number;
}

export const Frame: FC<PropsWithChildren<FrameOpts>> = (props) => {
  return (
	  <html lang="en">
	    <head>
        <link href={`/assets/fonts/atkinson-hyperlegible-next/fontface.css`} rel="stylesheet" />
        <link href={`/assets/fonts/atkinson-hyperlegible-mono/fontface.css`} rel="stylesheet" />
        <link href={`/assets/fonts/b612/fontface.css`} rel="stylesheet" />
        <link href={`/assets/fonts/b612-mono/fontface.css`} rel="stylesheet" />
        <link href={`/assets/styles.css`} rel="stylesheet" />
        {props.styles?.map(s => (<link href={s} rel="stylesheet" />))}
        <title>{props.title}</title>
        <script src="/assets/scripts.js"></script>
        { typeof props.refresh === 'number' && (
          <meta http-equiv="refresh" content={String(props.refresh)} />
        ) }
	    </head>
	    <body>
        { props.children }
        {props.scripts?.map(s => (<script src={s}></script>))}
        <script>
          gkInitValueUpdates();
        </script>
     </body>
   </html>
  );
};
