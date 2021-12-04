const path = require('path')

module.exports = {
  extends: '@vuepress/theme-default',
  plugins: [
    ['@vuepress/container', {
      type: 'code-group',
      render(tokens, idx) {
        if (tokens[idx].nesting === 1) {
          return '<panel-view>\n'
        } else {
          return '</panel-view>\n'
        }
      }
    }],
    ['@vuepress/register-components', {
      components: {
        PanelView: path.resolve(__dirname, './components/PanelView.vue'),
      }
    }]
  ]
}
