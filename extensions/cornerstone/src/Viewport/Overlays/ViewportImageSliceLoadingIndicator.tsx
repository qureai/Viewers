import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Enums } from '@cornerstonejs/core';

function ViewportImageSliceLoadingIndicator({ viewportData, element }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadIndicatorRef = useRef(null);
  const imageIdToBeLoaded = useRef(null);

  const setLoadingState = evt => {
    clearTimeout(loadIndicatorRef.current);

    loadIndicatorRef.current = setTimeout(() => {
      setLoading(true);
    }, 50);
  };

  const setFinishLoadingState = evt => {
    clearTimeout(loadIndicatorRef.current);

    setLoading(false);
  };

  const setErrorState = evt => {
    clearTimeout(loadIndicatorRef.current);

    if (imageIdToBeLoaded.current === evt.detail.imageId) {
      setError(evt.detail.error);
      imageIdToBeLoaded.current = null;
    }
  };

  useEffect(() => {
    element.addEventListener(
      Enums.Events.STACK_VIEWPORT_SCROLL,
      setLoadingState
    );
    element.addEventListener(Enums.Events.IMAGE_LOAD_ERROR, setErrorState);
    element.addEventListener(
      Enums.Events.STACK_NEW_IMAGE,
      setFinishLoadingState
    );

    return () => {
      element.removeEventListener(
        Enums.Events.STACK_VIEWPORT_SCROLL,
        setLoadingState
      );

      element.removeEventListener(
        Enums.Events.STACK_NEW_IMAGE,
        setFinishLoadingState
      );

      element.removeEventListener(Enums.Events.IMAGE_LOAD_ERROR, setErrorState);
    };
  }, [element, viewportData]);

  if (error) {
    return (
      <>
        <div className="bg-black absolute h-full w-full top-0 left-0 opacity-50">
          <div className="flex transparent items-center justify-center w-full h-full">
            <p className="text-red-500 text-md font-light">
              <p>Error Loading Image</p>
              <p>An error has occurred.</p>
              <p>{error}</p>
            </p>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      // IMPORTANT: we need to use the pointer-events-none class to prevent the loading indicator from
      // interacting with the mouse, since scrolling should propagate to the viewport underneath
      <div className="pointer-events-none bg-black  absolute h-full w-full top-0 left-0 text-md opacity-50">
        <div className="flex transparent items-center justify-center w-full h-full">
          <p className="text-teal-300 text-base font-light">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}

ViewportImageSliceLoadingIndicator.propTypes = {
  percentComplete: PropTypes.number,
  error: PropTypes.object,
  element: PropTypes.object,
};

ViewportImageSliceLoadingIndicator.defaultProps = {
  percentComplete: 0,
  error: null,
};

export default ViewportImageSliceLoadingIndicator;
