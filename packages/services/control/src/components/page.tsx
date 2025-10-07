
import {
  FC,
  PropsWithChildren,
} from 'hono/jsx';
import { Frame } from './frame.js';
import { InlineMenu, InlineMenuProps } from './inline-menu.js';
import { AutoResizingIframe } from './iframe.js';

export interface PageOpts {
  title: string;
  menu: InlineMenuProps;
  styles?: string[];
  scripts?: string[];
}

export const Page: FC<PropsWithChildren<PageOpts>> = (props) => {
  return (
    <Frame title="Grovekit Control" scripts={props.scripts} styles={props.styles}>
			<div id="q-page-wrapper">
  				<header id="q-site-header">
            <div id="q-site-title">
           	    <h1><a href="/">Grovekit</a></h1>
            </div>
            { props.menu && (
            <nav id="q-site-nav">
                <InlineMenu {...props.menu} />
            </nav>
            ) }
  				</header>
        <div id="q-page-content">
          {props.children}
        </div>
        <div id="q-page-footer">
          <AutoResizingIframe
            name="q-property-set-value-iframe"
            style={{
              display: 'block',
              position: 'fixed',
              bottom: '1rem',
              maxWidth: '800px',
              width: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
        </div>
			</div>
    </Frame>
  );
};
