
// ============================================================================
//                           0. TABLE OF CONTENTS
// ============================================================================

// 0. TABLE OF CONTENTS
// 1. IFRAMES, IFRAME MODALS
// 2. CHARTS
// 3. SSE VALUE UPDATES

// ============================================================================
//                         1. IFRAMES, IFRAME MODALS
// ============================================================================

(() => {

  globalThis.qResizeIframe = (el) => {
    const height = el.contentWindow.document.documentElement.scrollHeight;
    if (height == 0) {
      el.classList.add('q-iframe-empty');
    } else {
      el.classList.remove('q-iframe-empty');
    }
    el.style.height = el.contentWindow.document.documentElement.scrollHeight + 'px';
  };

})();

// ============================================================================
//                                2. CHARTS
// ============================================================================

(() => {

  const colors = ['red', 'green', 'yellow', 'blue', 'orange', 'purple'];

  const seriesOptsToUplotOpts = (o, i) => {
    const uplot_opts = {
      label: o.label,
      show: true,
      stroke: o.color ?? colors[i % colors.length],
      spanGaps: true,
    };
    if (o.style === 'dots') {
      uplot_opts.width = 0;
      uplot_opts.points = { show: true };
    }
    return uplot_opts;
  };


  /**
   * @typedef {Object} PlotDescriptor
   * @property {HTMLElement} el
   * @property {string} id
   * @property {any} data
   * @property {any} opts
   * @property {any} [plot]
   */

  /** @type {Map<string, PlotDescriptor>} */
  const plots_by_id = new Map();

  const destroyPlot = (descriptor) => {
    const { plot, el } = descriptor;
    if (plot) {
      plot.destroy();
      el.replaceChildren();
    }
  };

  /**
   *
   * @param {PlotDescriptor} descriptor
   */
  const drawPlot = (descriptor) => {
    const { el, opts, series, data } = descriptor;
    destroyPlot(descriptor);
    el.style.width = opts.width;
    el.style.height = opts.height;
    el.style.marginBottom = '3rem';



    const uplot_opts = {
      // title: opts.title,
      // id: "chart1",
      // class: "my-chart",
      // Adjusting uPlot's options as some of them cannot be serialized to/from
      // JSON, such as the tzDate() function.
      tzDate: (ts) => uPlot.tzDate(new Date(ts), opts.timezone),
      ms: 1,
      width: el.clientWidth,
      height: el.clientHeight,
      series: [
        {}, // time
        ...series.map(seriesOptsToUplotOpts),
      ],
    };

    const uplot_data = data ?? [];
    // uplot_data[0] = uplot_data[0].map(t => t / 1000);

    descriptor.plot = uPlot(uplot_opts, uplot_data, el);
  };


  const initPlot = ({ opts, series, data }, script_el) => {

    // If a previous plot with the same id is present in the map, we destroy it
    // and remove its element from the DOM.
    if (plots_by_id.has(opts.id)) {
      const old = plots_by_id.get(opts.id);
      destroyPlot(old);
      old.el.remove();
    }

    const el = document.createElement('div');
    el.id = opts.id;
    script_el.insertAdjacentElement('beforebegin', el);
    const nnew = { el, opts, series, data };
    plots_by_id.set(opts.id, nnew);

    drawPlot(nnew);
  };

  const onResize = () => {
    for (const descriptor of plots_by_id.values()) {
      drawPlot(descriptor);
    }
  };

  let resize_timeout = null;

  window.addEventListener('resize', () => {
    clearTimeout(resize_timeout);
    resize_timeout = setTimeout(onResize, 250);
  });


  const onloadInitPlots = () => {
    for (const script_el of document.querySelectorAll('script[type=q-chart-json]')) {
      const descriptor = JSON.parse(script_el.innerText);
      initPlot(descriptor, script_el);
      script_el.remove();
    }
  };

  window.addEventListener('load', onloadInitPlots);

  // const afterRequestDestroyPlots = () => {
  //   for (const descriptor of plots_by_id.values()) {
  //     if (!document.body.contains(descriptor.el)) {
  //       plots_by_id.delete(descriptor.id);
  //       destroyPlot(descriptor);
  //     }
  //   }
  // };

  // window.addEventListener('load', afterRequestDestroyPlots);
})();

// ============================================================================
//                         3. SSE VALUE UPDATES
// ============================================================================

(() => {

  const gkUpdateValue = (topic, value) => {
    document.querySelectorAll(`span.gk-property-value[topic="${topic}"] > span.gk-property-value_value`).forEach(el => {
      el.textContent = value;
    });
  };

  const gkSubscribeToValueUpdates = (topics) => {
    const url = new URL('/datafeed', window.location);
    for (const topic of topics) {
      url.searchParams.append('topic', topic);
    }
    const eventSource = new EventSource(url);
    eventSource.onmessage = (event) => {
      const { topic, value } = JSON.parse(event.data);
      gkUpdateValue(topic, value);
    };
    eventSource.onerror = (event) => {
      console.error('eventsource error', event);
    };
  };

  const gkInitValueUpdates = () => {

    const topics = [];

    for (const el of document.querySelectorAll('span.gk-property-value[topic]')) {
      topics.push(el.getAttribute('topic'));
    }

    if (topics.length > 0) {
      gkSubscribeToValueUpdates(topics);
    }

  };

  globalThis.gkInitValueUpdates = gkInitValueUpdates;

})();
