/* eslint-disable */
"use client";

import { axisBottom, axisLeft } from "d3-axis";
import { max } from "d3-array";
import { csv } from "d3-fetch";
import { scaleBand, scaleLinear, scaleOrdinal } from "d3-scale";
import { select } from "d3-selection";
import { useEffect, useRef, useState } from "react";

interface AnimalDatum {
  name: string;
  speed: number;
  diet: string;
}

const DIET_COLORS: Record<string, string> = {
  herbivore: "#22c55e",
  carnivore: "#f97316",
  omnivore: "#eab308",
};

export default function AnimalSpeedGraph() {
  const graphRef = useRef<HTMLDivElement>(null);
  const [animalData, setAnimalData] = useState<AnimalDatum[]>([]);

  useEffect(() => {
    csv("/sample_animals.csv").then((rows) => {
      setAnimalData(
        rows.map((row) => ({
          name: row.name ?? "",
          speed: Number(row.speed) || 0,
          diet: (row.diet ?? "").toLowerCase(),
        })),
      );
    });
  }, []);

  useEffect(() => {
    if (!graphRef.current || animalData.length === 0) return;

    graphRef.current.innerHTML = "";

    const containerWidth = graphRef.current.clientWidth ?? 800;
    const containerHeight = graphRef.current.clientHeight ?? 500;
    const width = Math.max(containerWidth, 600);
    const height = Math.max(containerHeight, 400);
    const margin = { top: 70, right: 120, bottom: 120, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = select(graphRef.current)
      .append<SVGSVGElement>("svg")
      .attr("width", width)
      .attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = scaleBand()
      .domain(animalData.map((d) => d.name))
      .range([0, innerWidth])
      .padding(0.2);

    const maxSpeed = max(animalData, (d) => d.speed) ?? 120;
    const yScale = scaleLinear()
      .domain([0, Math.ceil(maxSpeed / 10) * 10])
      .range([innerHeight, 0]);

    const colorScale = scaleOrdinal<string, string>()
      .domain(["herbivore", "omnivore", "carnivore"])
      .range([
        DIET_COLORS.herbivore ?? "#22c55e",
        DIET_COLORS.omnivore ?? "#eab308",
        DIET_COLORS.carnivore ?? "#f97316",
      ]);

    g.selectAll(".bar")
      .data(animalData)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.name) ?? 0)
      .attr("y", (d) => yScale(d.speed))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => innerHeight - yScale(d.speed))
      .attr("fill", (d) => colorScale(d.diet) ?? "#888");

    const domain = xScale.domain();
    const tickStep = Math.max(1, Math.floor(domain.length / 25));
    const xAxis = axisBottom(xScale).tickValues(
      domain.filter((_, i) => i % tickStep === 0),
    );
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("fill", "currentColor");

    g.append("g")
      .call(axisLeft(yScale))
      .selectAll("text")
      .attr("fill", "currentColor");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .style("font-size", "1.25rem")
      .style("font-weight", "bold")
      .text("How Fast Are Animals?");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -margin.left + 20)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .text("Speed (km/h)");

    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .text("Animal");

    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - margin.right - 90},${margin.top})`);

    ["Herbivore", "Omnivore", "Carnivore"].forEach((label, i) => {
      const dietKey = label.toLowerCase();
      const legendRow = legend.append("g").attr("transform", `translate(0,${i * 22})`);
      legendRow
        .append("rect")
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", DIET_COLORS[dietKey]);
      legendRow
        .append("text")
        .attr("x", 20)
        .attr("y", 12)
        .attr("fill", "currentColor")
        .style("font-size", "12px")
        .text(label);
    });
  }, [animalData]);

  return (
    <div
      ref={graphRef}
      className="min-h-[500px] w-full"
      style={{ minHeight: "500px" }}
    />
  );
}
