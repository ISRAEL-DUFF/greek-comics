import React from 'react';

export class PrintableStory extends React.Component<React.PropsWithChildren> {
  divRef = React.createRef<HTMLDivElement>();

  getDiv() {
    return this.divRef.current;
  }

  render() {
    return <div ref={this.divRef}>{this.props.children}</div>;
  }
}