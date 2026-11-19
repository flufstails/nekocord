import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  stripQueryParams: {
    type: OptionType.BOOLEAN,
    label: 'Remove Link Tracking Tags',
    description: 'Strip tracking tags at the end of links you send.',
    default: true,
  },
  redirectPrefix: {
    type: OptionType.STRING,
    label: 'Optional Redirect Prefix',
    description: 'Optional privacy redirect link added before each URL (leave blank for none).',
    placeholder: 'https://href.li/?',
    default: '',
  },
});

const URL_RE = /https?:\/\/[^\s<>]+/g;

const inner = createUrlTransformPlugin((segment) =>
  segment.replace(URL_RE, (rawUrl) => {
    let url = rawUrl;
    if (settings.store.stripQueryParams) {
      const qIdx = url.indexOf('?');
      if (qIdx > 0) {
        const hashIdx = url.indexOf('#', qIdx);
        url = hashIdx > 0 ? `${url.slice(0, qIdx)}${url.slice(hashIdx)}` : url.slice(0, qIdx);
      }
    }
    const prefix = String(settings.store.redirectPrefix || '').trim();
    if (prefix && url.indexOf(prefix) !== 0) {
      url = `${prefix}${url}`;
    }
    return url;
  }),
);

export default definePlugin({
  ...inner,
  settings,
});
