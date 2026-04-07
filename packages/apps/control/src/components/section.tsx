import { Child, FC, PropsWithChildren } from "hono/jsx";

export interface SectionProps {
  title: string;
  opts?: Child;
}

export const Section: FC<PropsWithChildren<SectionProps>> = (props) => {

  return (
    <section class="q-section">
      <div class="q-section-header">
        <h2 class="q-section-title">{ props.title }</h2>
        {props.opts && (<div class="q-section-opts">{props.opts}</div>)}
      </div>
      { props.children }
    </section>
  );

};
