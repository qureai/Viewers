import React, { useCallback, useEffect, useMemo, useState } from "react";
import { vec3 } from "gl-matrix";
import PropTypes from "prop-types";
import { metaData, Enums, utilities } from "@cornerstonejs/core";
import ViewportOverlay from "../../components/ViewportOverlay";
import {
  formatPN,
  formatDICOMDate,
  formatDICOMTime,
  formatNumberPrecision,
} from "./utils";
import { InstanceMetadata } from "platform/core/src/types";
import { ServicesManager } from "@ohif/core";
import { ImageSliceData } from "@cornerstonejs/core/dist/esm/types";

// import './CustomizableViewportOverlay.css';

const EPSILON = 1e-4;

interface OverlayItemProps {
  element: any;
  viewportData: any;
  imageSliceData: ImageSliceData;
  viewportIndex: number | null;
  servicesManager: ServicesManager;
  instance: InstanceMetadata;
  customization: any;
  formatters: {
    formatPN: (val) => string;
    formatDate: (val) => string;
    formatTime: (val) => string;
    formatNumberPrecision: (val, number) => string;
  };

  // calculated values
  voi: {
    windowWidth: number;
    windowCenter: number;
  };
  instanceNumber?: number;
  scale?: number;
}

/**
 * Window Level / Center Overlay item
 */
function VOIOverlayItem({ voi, customization }: OverlayItemProps) {
  const { windowWidth, windowCenter } = voi;
  if (typeof windowCenter !== "number" || typeof windowWidth !== "number") {
    return null;
  }

  return (
    <div
      className="overlay-item flex flex-row"
      style={{ color: (customization && customization.color) || undefined }}
    >
      <span className="mr-1 shrink-0">W:</span>
      <span className="ml-1 mr-2 font-light shrink-0">{windowWidth.toFixed(0)}</span>
      <span className="mr-1 shrink-0">L:</span>
      <span className="ml-1 font-light shrink-0">{windowCenter.toFixed(0)}</span>
    </div>
  );
}

/**
 * Zoom Level Overlay item
 */
function ZoomOverlayItem({ scale, customization }: OverlayItemProps) {
  return (
    <div
      className="overlay-item flex flex-row"
      style={{ color: (customization && customization.color) || undefined }}
    >
      <span className="mr-1 shrink-0">Zoom:</span>
      <span className="font-light">{scale.toFixed(2)}x</span>
    </div>
  );
}

/**
 * Instance Number Overlay Item
 */
function InstanceNumberOverlayItem({
  instanceNumber,
  imageSliceData,
  customization,
}: OverlayItemProps) {
  const { imageIndex, numberOfSlices } = imageSliceData;

  return (
    <>
      {numberOfSlices > 1 && (
        <div
          className="overlay-item flex flex-row text-md"
          style={{ color: (customization && customization.color) || undefined }}
        >
          <div>
            <svg
              className="text-teal-300 mr-2"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M6.354.466C6.557.38 6.78.333 7 .333c.221 0 .42.046.646.133l5.45 2.336a.94.94 0 0 1 0 1.73l-5.45 2.335A1.706 1.706 0 0 1 7 7a1.62 1.62 0 0 1-.646-.133L.904 4.531a.94.94 0 0 1 0-1.729L6.354.466ZM7 1.583c-.075 0-.128.011-.154.032L2.06 3.667l4.787 2.052c.026.02.079.031.154.031.052 0 .104-.01.154-.031l4.786-2.052-4.786-2.052A.396.396 0 0 0 7 1.583Zm-.154 7.47c.026.02.079.03.154.03.052 0 .104-.01.154-.03l4.95-2.123a.626.626 0 0 1 .8-.906l.237.12a.949.949 0 0 1-.05 1.723l-5.445 2.334a1.707 1.707 0 0 1-.646.133 1.62 1.62 0 0 1-.646-.133L.927 7.875a.978.978 0 0 1-.183-1.698l.268-.192a.625.625 0 0 1 .872.145.6.6 0 0 1-.064.779l5.026 2.143Zm-4.962.41a.6.6 0 0 1-.064.78l5.026 2.143c.026.02.079.03.154.03.052 0 .104-.01.154-.03l4.95-2.123a.626.626 0 0 1 .8-.906l.237.12a.949.949 0 0 1-.05 1.724l-5.445 2.333a1.705 1.705 0 0 1-.646.133c-.221 0-.443-.044-.646-.133L.927 11.209A.978.978 0 0 1 .744 9.51l.268-.193a.625.625 0 0 1 .872.146Z" />
            </svg>
          </div>
          <span className="mr-1 shrink-0">I:</span>
          {
            <span className="font-light">
              {instanceNumber !== undefined && instanceNumber !== null
                ? `${instanceNumber} (${imageIndex + 1}/${numberOfSlices})`
                : `${imageIndex + 1}/${numberOfSlices}`}
            </span>
          }
        </div>
      )}
    </>
  );
}

/**
 * Customizable Viewport Overlay
 */
function CustomizableViewportOverlay({
  element,
  viewportData,
  imageSliceData,
  viewportIndex,
  servicesManager,
}) {
  const {
    toolbarService,
    cornerstoneViewportService,
    customizationService,
  } = servicesManager.services;
  const [voi, setVOI] = useState({ windowCenter: null, windowWidth: null });
  const [scale, setScale] = useState(1);
  const [activeTools, setActiveTools] = useState([]);
  const { imageIndex } = imageSliceData;

  const topLeftCustomization = customizationService.getModeCustomization(
    "cornerstoneOverlayTopLeft"
  );
  const topRightCustomization = customizationService.getModeCustomization(
    "cornerstoneOverlayTopRight"
  );
  const bottomLeftCustomization = customizationService.getModeCustomization(
    "cornerstoneOverlayBottomLeft"
  );
  const bottomRightCustomization = customizationService.getModeCustomization(
    "cornerstoneOverlayBottomRight"
  );

  const instance = useMemo(() => {
    if (viewportData != null) {
      return _getViewportInstance(viewportData, imageIndex);
    } else {
      return null;
    }
  }, [viewportData, imageIndex]);

  const instanceNumber = useMemo(() => {
    if (viewportData != null) {
      return _getInstanceNumber(
        viewportData,
        viewportIndex,
        imageIndex,
        cornerstoneViewportService
      );
    }
    return null;
  }, [viewportData, viewportIndex, imageIndex, cornerstoneViewportService]);

  /**
   * Initial toolbar state
   */
  useEffect(() => {
    setActiveTools(toolbarService.getActiveTools());
  }, []);

  /**
   * Updating the VOI when the viewport changes its voi
   */
  useEffect(() => {
    const updateVOI = (eventDetail) => {
      const { range } = eventDetail.detail;

      if (!range) {
        return;
      }

      const { lower, upper } = range;
      const { windowWidth, windowCenter } = utilities.windowLevel.toWindowLevel(
        lower,
        upper
      );

      setVOI({ windowCenter, windowWidth });
    };

    element.addEventListener(Enums.Events.VOI_MODIFIED, updateVOI);

    return () => {
      element.removeEventListener(Enums.Events.VOI_MODIFIED, updateVOI);
    };
  }, [viewportIndex, viewportData, voi, element]);

  /**
   * Updating the scale when the viewport changes its zoom
   */
  useEffect(() => {
    const updateScale = (eventDetail) => {
      const { previousCamera, camera } = eventDetail.detail;

      if (
        previousCamera.parallelScale !== camera.parallelScale ||
        previousCamera.scale !== camera.scale
      ) {
        const viewport = cornerstoneViewportService.getCornerstoneViewportByIndex(
          viewportIndex
        );

        if (!viewport) {
          return;
        }

        const imageData = viewport.getImageData();

        if (!imageData) {
          return;
        }

        if (camera.scale) {
          setScale(camera.scale);
          return;
        }

        const { spacing } = imageData;
        // convert parallel scale to scale
        const scale = (element.clientHeight * spacing[0] * 0.5) / camera.parallelScale;
        setScale(scale);
      }
    };

    element.addEventListener(Enums.Events.CAMERA_MODIFIED, updateScale);

    return () => {
      element.removeEventListener(Enums.Events.CAMERA_MODIFIED, updateScale);
    };
  }, [viewportIndex, viewportData, cornerstoneViewportService, element]);

  /**
   * Updating the active tools when the toolbar changes
   */
  // Todo: this should act on the toolGroups instead of the toolbar state
  useEffect(() => {
    const { unsubscribe } = toolbarService.subscribe(
      toolbarService.EVENTS.TOOL_BAR_STATE_MODIFIED,
      () => {
        setActiveTools(toolbarService.getActiveTools());
      }
    );

    return () => {
      unsubscribe();
    };
  }, [toolbarService]);

  const _renderOverlayItem = useCallback(
    (item) => {
      const overlayItemProps: OverlayItemProps = {
        element,
        viewportData,
        imageSliceData,
        viewportIndex,
        servicesManager,
        customization: item,
        formatters: {
          formatPN: formatPN,
          formatDate: formatDICOMDate,
          formatTime: formatDICOMTime,
          formatNumberPrecision: formatNumberPrecision,
        },
        instance,
        // calculated
        voi,
        scale,
        instanceNumber,
      };

      if (item.customizationType === "ohif.overlayItem.windowLevel") {
        return <VOIOverlayItem {...overlayItemProps} />;
      } else if (item.customizationType === "ohif.overlayItem.zoomLevel") {
        return <ZoomOverlayItem {...overlayItemProps} />;
      } else if (item.customizationType === "ohif.overlayItem.instanceNumber") {
        return <InstanceNumberOverlayItem {...overlayItemProps} />;
      } else {
        const renderItem = customizationService.transform(item);

        if (typeof renderItem.content === "function") {
          return renderItem.content(overlayItemProps);
        }
      }
    },
    [
      element,
      viewportData,
      imageSliceData,
      viewportIndex,
      servicesManager,
      customizationService,
      instance,
      voi,
      scale,
      instanceNumber,
    ]
  );

  const getTopLeftContent = useCallback(() => {
    const items = topLeftCustomization?.items || [
      {
        id: "WindowLevel",
        customizationType: "ohif.overlayItem.windowLevel",
      },
    ];
    return (
      <>
        {items.map((item, i) => (
          <div key={`topLeftOverlayItem_${i}`}>{_renderOverlayItem(item)}</div>
        ))}
      </>
    );
  }, [topLeftCustomization, _renderOverlayItem]);

  const getTopRightContent = useCallback(() => {
    const items = topRightCustomization?.items || [
      {
        id: "InstanceNmber",
        customizationType: "ohif.overlayItem.instanceNumber",
      },
    ];
    return (
      <>
        {items.map((item, i) => (
          <div key={`topRightOverlayItem_${i}`}>{_renderOverlayItem(item)}</div>
        ))}
      </>
    );
  }, [topRightCustomization, _renderOverlayItem]);

  const getBottomLeftContent = useCallback(() => {
    const items = bottomLeftCustomization?.items || [];
    return (
      <>
        {items.map((item, i) => (
          <div key={`bottomLeftOverlayItem_${i}`}>{_renderOverlayItem(item)}</div>
        ))}
      </>
    );
  }, [bottomLeftCustomization, _renderOverlayItem]);

  const getBottomRightContent = useCallback(() => {
    const items = bottomRightCustomization?.items || [];
    return (
      <>
        {items.map((item, i) => (
          <div key={`bottomRightOverlayItem_${i}`}>{_renderOverlayItem(item)}</div>
        ))}
      </>
    );
  }, [bottomRightCustomization, _renderOverlayItem]);

  return (
    <ViewportOverlay
      bottomLeft={getTopLeftContent()}
      bottomRight={getTopRightContent()}
    />
  );
}

function _getViewportInstance(viewportData, imageIndex) {
  let imageId = null;
  if (viewportData.viewportType === Enums.ViewportType.STACK) {
    imageId = viewportData.data.imageIds[imageIndex];
  } else if (viewportData.viewportType === Enums.ViewportType.ORTHOGRAPHIC) {
    const volumes = viewportData.volumes;
    if (volumes && volumes.length == 1) {
      const volume = volumes[0];
      imageId = volume.imageIds[imageIndex];
    }
  }
  return imageId ? metaData.get("instance", imageId) || {} : {};
}

function _getInstanceNumber(
  viewportData,
  viewportIndex,
  imageIndex,
  cornerstoneViewportService
) {
  let instanceNumber;

  if (viewportData.viewportType === Enums.ViewportType.STACK) {
    instanceNumber = _getInstanceNumberFromStack(viewportData, imageIndex);

    if (!instanceNumber && instanceNumber !== 0) {
      return null;
    }
  } else if (viewportData.viewportType === Enums.ViewportType.ORTHOGRAPHIC) {
    instanceNumber = _getInstanceNumberFromVolume(
      viewportData,
      imageIndex,
      viewportIndex,
      cornerstoneViewportService
    );
  }
  return instanceNumber;
}

function _getInstanceNumberFromStack(viewportData, imageIndex) {
  const imageIds = viewportData.data.imageIds;
  const imageId = imageIds[imageIndex];

  if (!imageId) {
    return;
  }

  const generalImageModule = metaData.get("generalImageModule", imageId) || {};
  const { instanceNumber } = generalImageModule;

  const stackSize = imageIds.length;

  if (stackSize <= 1) {
    return;
  }

  return parseInt(instanceNumber);
}

// Since volume viewports can be in any view direction, they can render
// a reconstructed image which don't have imageIds; therefore, no instance and instanceNumber
// Here we check if viewport is in the acquisition direction and if so, we get the instanceNumber
function _getInstanceNumberFromVolume(
  viewportData,
  imageIndex,
  viewportIndex,
  cornerstoneViewportService
) {
  const volumes = viewportData.volumes;

  // Todo: support fusion of acquisition plane which has instanceNumber
  if (!volumes || volumes.length > 1) {
    return;
  }

  const volume = volumes[0];
  const { direction, imageIds } = volume;

  const cornerstoneViewport = cornerstoneViewportService.getCornerstoneViewportByIndex(
    viewportIndex
  );

  if (!cornerstoneViewport) {
    return;
  }

  const camera = cornerstoneViewport.getCamera();
  const { viewPlaneNormal } = camera;
  // checking if camera is looking at the acquisition plane (defined by the direction on the volume)

  const scanAxisNormal = direction.slice(6, 9);

  // check if viewPlaneNormal is parallel to scanAxisNormal
  const cross = vec3.cross(vec3.create(), viewPlaneNormal, scanAxisNormal);
  const isAcquisitionPlane = vec3.length(cross) < EPSILON;

  if (isAcquisitionPlane) {
    const imageId = imageIds[imageIndex];

    if (!imageId) {
      return {};
    }

    const { instanceNumber } = metaData.get("generalImageModule", imageId) || {};
    return parseInt(instanceNumber);
  }
}

CustomizableViewportOverlay.propTypes = {
  viewportData: PropTypes.object,
  imageIndex: PropTypes.number,
  viewportIndex: PropTypes.number,
};

export default CustomizableViewportOverlay;
