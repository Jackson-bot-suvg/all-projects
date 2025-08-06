"use client";

import React, { useState } from "react";
import { Card, Radio, Slider, Typography, Divider, Button } from "antd";
import { observer } from "mobx-react-lite";
import { useStore } from "../../hooks/useStore";

const { Title } = Typography;
const { Group } = Radio;

export const Filter: React.FC = observer(() => {
  const { searchStore } = useStore();

  // Local state used only for updating the UI
  const [localRange, setLocalRange] = useState<[number, number]>(searchStore.priceRange);

  const handleBrandChange = (e: any) => {
    const brand = e.target.value;
    searchStore.setBrandFilter(brand);
    searchStore.search();
  };

  // During drag: update only the local state, do not update store or trigger search
  const handlePriceChange = (value: [number, number]) => {
    setLocalRange(value);
  };

  // After drag complete: update store and trigger search
  const handleAfterChange = (value: [number, number]) => {
    searchStore.setPriceRange(value);
    searchStore.search();
  };

  const handleReset = () => {
    searchStore.resetFilters();
    searchStore.search();
    setLocalRange(searchStore.priceRangeLimits);
  };

  return (
    <Card title="Filter Products" style={{ marginBottom: 16 }}>
      {/* Brand section unchanged */}
      <div>
        <Title level={5}>Brand</Title>
        <Group value={searchStore.brandFilter} onChange={handleBrandChange}>
          <Radio value="">All Brands</Radio>
          {searchStore.availableBrands.map((brand) => (
            <Radio key={brand} value={brand}>{brand}</Radio>
          ))}
        </Group>
      </div>

      <Divider />

      {/* Price Range section */}
      <div>
        <Title level={5}>Price Range</Title>
        <Slider
          range
          min={searchStore.priceRangeLimits[0]}
          max={searchStore.priceRangeLimits[1]}
          value={localRange}
          onChange={handlePriceChange}
          onChangeComplete={handleAfterChange}
          tooltip={{ formatter: (val) => `$${val}` }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span>${localRange[0]}</span>
          <span>${localRange[1]}</span>
        </div>
      </div>

      <Divider />

      <Button type="primary" onClick={handleReset} style={{ width: "100%" }}>
        Reset Filters
      </Button>
    </Card>
  );
});

export default Filter;
