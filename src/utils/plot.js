// react-plotly.js를 경량 번들(plotly.js-dist-min)로 구성.
// 기본 'react-plotly.js'는 전체 plotly.js를 불러오므로 factory 패턴 사용.
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';

const Plot = createPlotlyComponent(Plotly);
export default Plot;
export { Plotly };
