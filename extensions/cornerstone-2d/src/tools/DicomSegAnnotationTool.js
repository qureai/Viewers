import cornerstoneTools, {
  importInternal,
  getToolState,
  toolColors,
  getModule,
  globalImageIdSpecificToolStateManager,
} from "cornerstone-tools";
import cornerstone from "cornerstone-core";
import TOOL_NAMES from "./TOOL_NAMES";

const { DICOM_SEG_ANNOTATION_TOOL } = TOOL_NAMES;
const { getters } = getModule("segmentation");

// Cornerstone 3rd party dev kit imports
const BaseTool = importInternal("base/BaseTool");

/**
 * @class RTStructDisplayTool - Renders RTSTRUCT data in a read only manner (i.e. as an overlay).
 * @extends cornerstoneTools.BaseTool
 */
export default class DicomSegAnnotationTool extends BaseTool {
  constructor(props = {}) {
    const defaultProps = {
      mixins: ["enabledOrDisabledBinaryTool"],
      name: DICOM_SEG_ANNOTATION_TOOL,
    };

    const initialProps = Object.assign(defaultProps, props);

    super(initialProps);

    this._rtStructModule = cornerstoneTools.getModule("rtstruct");
  }

  renderToolData(evt) {
    const eventData = evt.detail;
    const { element } = eventData;
    const toolState = getToolState(evt.currentTarget, this.name);

    if (!toolState) {
      return;
    }

    // We have tool data for this element - iterate over each one and draw it

    // for (let i = 0; i < toolState.data.length; i++) {
    //   const data = toolState.data[i];
    //   const crossHairCenter = data.center;

    //   drawCanvasCrosshairs(eventData, crossHairCenter, {
    //     color: toolColors.getActiveColor(),
    //     lineWidth: 1,
    //   });

    //   // Remove the crosshairs, we only render them for one redraw.
    //   toolState.data.pop();
    // }
  }
}

DicomSegAnnotationTool.showAnnotationtool = (x, y, eventData) => {
  const event = new CustomEvent("showSegmentationToolAssistant", {
    detail: {
      data: {
        coordinates: { x, y },
        eventData,
      },
    },
  });
  document.dispatchEvent(event);

  // create a custom event and dispatch the document
};
