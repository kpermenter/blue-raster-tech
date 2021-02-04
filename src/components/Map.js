import React, { useRef, useEffect, useState } from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import ArcGISMap from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import VectorTileLayer from "@arcgis/core/layers/VectorTileLayer";
import LayerList from "@arcgis/core/widgets/LayerList";
import { sqlExpressions } from '../app/data'

let globalBikeLayerView;

function Map() {
  // ref DOM container
  const mapDiv = useRef(null);
  const selectDiv = useRef(null);
  const[data, setData] = useState([]);
  const[globalView, setGlobalView] = useState()

  const onChange = (e) => {
    setFeatureLayerViewFilter(e.target.value)
  }

  const setFeatureLayerViewFilter = (select) => {
    globalBikeLayerView.effect = {
      filter: {
        where: `Neighborho = '${select}'`,
      },
      excludedEffect: "opacity(0%)",
    };
  }

  useEffect(() => {
    if (mapDiv.current) {
      // create map
      const map = new ArcGISMap({
      });

      // create view
      const view = new MapView({
        container: mapDiv.current,
        map,
        zoom: 10,
        center: [-95.358421, 29.749907],
        extent: {
          spatialReference: {
            wkid: 102100,
          },
          XMin: -1.0637090660842678E7,
          YMin: 3463967.325672608,
          XMax: -1.0611521554309536E7,
          YMax: 3477887.4696560656
        },
      });

      // add tile layer as basemap
      const tileLayer = new VectorTileLayer({
        url:
          "https://jsapi.maps.arcgis.com/sharing/rest/content/items/75f4dfdff19e445395653121a95a85db/resources/styles/root.json",
        title: "Basemap"
      });
      map.add(tileLayer);

      // add bike station layer
    const bikeLayer = new FeatureLayer({
      url:
        "https://cohegis.houstontx.gov/cohgispub/rest/services/PD/Transportation_wm/MapServer/2",
      outFields: ["*"],
      popupTemplate: {
        title: "{Name}",
        content: "{Name} Station in {Neighborho}"
      },
    });
    map.add(bikeLayer);

    view.whenLayerView(bikeLayer).then(function (bikeLayerView) {
      globalBikeLayerView = bikeLayerView
    });

      const queryData = () => {
        var wellsQuery = bikeLayer.createQuery();
        wellsQuery.returnDistinctValues = true;
        wellsQuery.returnGeometry = false;
        wellsQuery.outFields = "Neighborho";

        return bikeLayer.queryFeatures(wellsQuery).then(function (response) {
          var featureRes = response.features
          const dataRes = featureRes.map(el => {
            return el.attributes.Neighborho
          })
          setData(dataRes)
          });
    }
    (view.ui.add(selectDiv.current, "top-right"))
    queryData()

    // layer list in legend
    const layerList = new LayerList({
      view,
      container: "layerList",
      listItemCreatedFunction: function (event) {
        const item = event.item;
        item.open = true;
        item.panel = {
          content: ["legend"],
        };
      },
    });
    view.ui.add(layerList, "bottom-right");

    // select attributes to query
    const selectFilter = document.createElement("select");
    selectFilter.setAttribute("class", "esri-widget esri-select");
    selectFilter.setAttribute(
      "style",
      "width: 275px; font-family: Avenir Next W00; font-size: 1em;"
    );

    sqlExpressions.forEach(function (sql) {
      var option = document.createElement("option");
      option.value = sql;
      option.innerHTML = sql;
      selectFilter.appendChild(option);
    });

    setGlobalView(view)

    return () => {
      // destroy map view
      view.container = null;
    }
  }
  }, []);

return <div className="mapDiv" ref={mapDiv}>

  <select onChange={onChange} ref={selectDiv}>
    {data.map(el => {
      return <option value={el}>{el}</option>
    })}
  </select>
</div>;
}

export default Map;