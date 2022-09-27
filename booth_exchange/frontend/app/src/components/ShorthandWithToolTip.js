import React from 'react';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

class ShorthandWithToolTip extends React.Component {
  render() {
    return (
    <OverlayTrigger
      key={"overlaytrigger_" + this.props.long_version}
      placement="right"
      delay={{ show: 250, hide: 1500 }}
      overlay={this.props.renderTooltip(this.props, this.props.long_version)}
    >
      <Button variant="light">{this.props.short_version}</Button>
    </OverlayTrigger>
    )
  }
}

export default ShorthandWithToolTip;