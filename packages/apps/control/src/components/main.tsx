import { FC, PropsWithChildren } from "hono/jsx";
import { InlineMenu, InlineMenuProps } from "./inline-menu.js";


export interface MainProps {
  title?: string;
  subtitle?: string;
  menu?: InlineMenuProps;
}

// items={[
//     { label: 'Info & Properties', href: '/devices/list', active: true },
//     { label: 'Reports', href: '/reports/list', active: false },
//     { label: 'Alerts', href: '/alerts/list', active: false },
// ]}

export const Main: FC<PropsWithChildren<MainProps>> = (props) => {
  return (
    <main class="q-main">
      { (props.title || props.menu) && (
        <div class="q-main-header">
          <div class="q-main-titles">
            { props.title && (<h1>{ props.title }</h1>) }
            { props.subtitle && (<h2>{ props.subtitle }</h2>) }
          </div>
          { props.menu && (<InlineMenu {...props.menu } style={{marginLeft: '1rem'}} />) }
        </div>
      ) }
      <div class="q-main-body">
        { props.children }
      </div>
    </main>
  );
};
