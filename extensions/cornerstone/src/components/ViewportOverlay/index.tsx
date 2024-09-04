import React from 'react';
import classnames from 'classnames';

const classes = {
  topLeft: 'top-viewport left-viewport',
  topRight: 'top-viewport right-viewport',
  bottomRight: 'bottom-viewport right-viewport',
  bottomLeft: 'bottom-viewport left-viewport',
};

const ViewportOverlay = ({
  topLeft,
  topRight,
  bottomRight,
  bottomLeft,
  color,
}) => {
  const overlay = 'absolute pointer-events-none viewport-overlay';
  return (
    <div className={classnames(color ? 'text-primary-light' : 'text-md')}>
      <div
        data-cy={'viewport-overlay-top-left'}
        className={classnames(overlay, classes.topLeft)}
      >
        {topLeft}
      </div>
      <div
        data-cy={'viewport-overlay-top-right'}
        className={classnames(overlay, classes.topRight)}
      >
        {topRight}
      </div>
      <div
        data-cy={'viewport-overlay-bottom-right'}
        className={classnames(overlay, classes.bottomRight)}
      >
        {bottomRight}
      </div>
      <div
        data-cy={'viewport-overlay-bottom-left'}
        className={classnames(overlay, classes.bottomLeft)}
      >
        {bottomLeft}
      </div>
    </div>
  );
};

export default ViewportOverlay;
