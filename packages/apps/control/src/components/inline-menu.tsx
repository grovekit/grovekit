import { Child, CSSProperties, FC } from "hono/jsx";


export interface InlineMenuProps {
  items: {
    label: string | Child;
    href: string;
    active: boolean;
  }[];
  style?: CSSProperties;
}

export const InlineMenu: FC<InlineMenuProps> = (props) => {
  return (
    <ul class="q-inline-menu" style={props.style}>
      {props.items.map((item) => (
        <li>
          <a href={item.href} class={item.active ? 'q-active' : ''}>
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
};
