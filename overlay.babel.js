const React = require('react');
const ReactDOM = require('react-dom');

const Overlay = require('./Overlay.jsx');

const app = document.getElementById('app');
ReactDOM.render(React.createElement(Overlay), app);
