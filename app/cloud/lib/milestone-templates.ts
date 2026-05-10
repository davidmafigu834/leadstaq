export type MilestoneTemplate = {
  title: string;
  description: string;
  statLabel?: string;
};

const constructionTemplates: MilestoneTemplate[] = [
  { title: "Site preparation", description: "Site cleared and marked out. Ground surveys completed and equipment mobilised.", statLabel: "days of preparation" },
  { title: "Foundation excavation", description: "Excavation completed to the required depth. Foundation trenches prepared and inspected.", statLabel: "cubic metres excavated" },
  { title: "Foundation pour", description: "Concrete foundation poured and left to cure. Steel reinforcement laid to specification.", statLabel: "cubic metres of concrete" },
  { title: "Base structure", description: "Base walls begun. Block laying commenced on the cured foundation.", statLabel: "workers on site" },
  { title: "Block laying", description: "Walls built to window-sill level. Progress inspected and approved by client.", statLabel: "blocks laid" },
  { title: "Roofing structure", description: "Roof trusses installed and secured. Structural inspection passed.", statLabel: "days to complete" },
  { title: "Roof sheeting", description: "IBR or tile sheeting installed. Guttering and fascia boards fitted.", statLabel: "square metres covered" },
  { title: "Window & door frames", description: "All window and door frames installed. Plastering can now begin.", statLabel: "frames installed" },
  { title: "Electrical rough-in", description: "Conduit and cabling installed throughout. DB board positioned.", statLabel: "circuits installed" },
  { title: "Plumbing rough-in", description: "All supply and waste pipes installed and pressure tested.", statLabel: "fixtures roughed in" },
  { title: "Plastering", description: "Internal and external plastering complete. Walls prepared for painting.", statLabel: "square metres plastered" },
  { title: "Tiling", description: "Floor and wall tiling completed throughout. Grout applied and cleaned.", statLabel: "square metres tiled" },
  { title: "Painting", description: "Two coats applied throughout. Ceilings, walls, and trims finished to specification.", statLabel: "litres of paint used" },
  { title: "Finishing & fittings", description: "All electrical fittings, plumbing fixtures, and hardware installed.", statLabel: "days to complete" },
  { title: "Handover", description: "Final inspection passed. Keys handed over to the client. Project complete.", statLabel: "snagging items resolved" },
];

const solarTemplates: MilestoneTemplate[] = [
  { title: "Site survey", description: "Roof structure assessed. Shading analysis completed. System size confirmed.", statLabel: "kW system size" },
  { title: "Equipment delivery", description: "Panels, inverter, and mounting hardware delivered and inspected on site.", statLabel: "panels delivered" },
  { title: "Roof preparation", description: "Mounting brackets installed. Roof integrity checked and any repairs made.", statLabel: "hours of preparation" },
  { title: "Panel mounting", description: "All solar panels mounted and secured to the roof structure.", statLabel: "panels installed" },
  { title: "Inverter installation", description: "Inverter mounted and configured. DC wiring connected from panels.", statLabel: "kW inverter capacity" },
  { title: "Wiring & connections", description: "All AC and DC wiring completed. Safety disconnects installed.", statLabel: "metres of cable run" },
  { title: "Battery installation", description: "Battery bank installed and configured for backup power.", statLabel: "kWh storage capacity" },
  { title: "Testing & commissioning", description: "System fully tested. Output confirmed at rated capacity. Safety checks passed.", statLabel: "kWh produced on test day" },
  { title: "Client training", description: "Client trained on system operation, monitoring app, and maintenance schedule.", statLabel: "hours of training" },
  { title: "Handover", description: "Warranty documentation provided. System handed over fully operational.", statLabel: "year warranty" },
];

const landscapingTemplates: MilestoneTemplate[] = [
  { title: "Site assessment", description: "Existing garden assessed. Soil tested. Design brief agreed with client.", statLabel: "square metres of garden" },
  { title: "Ground clearing", description: "Existing vegetation removed. Ground levelled and prepared for new layout.", statLabel: "loads of material removed" },
  { title: "Soil preparation", description: "Topsoil improved with compost and fertiliser. pH balanced for planting.", statLabel: "cubic metres of topsoil" },
  { title: "Irrigation installation", description: "Drip irrigation system installed throughout all planting beds.", statLabel: "irrigation zones" },
  { title: "Planting", description: "All trees, shrubs, and ground cover planted according to the design plan.", statLabel: "plants installed" },
  { title: "Lawn installation", description: "Lawn area prepared and grass laid. First watering completed.", statLabel: "square metres of lawn" },
  { title: "Hardscaping", description: "Paving, retaining walls, and pathways completed.", statLabel: "square metres paved" },
  { title: "Water features", description: "Water features installed and connected. Pumps tested and operational.", statLabel: "features installed" },
  { title: "Final touches", description: "Mulching applied to all beds. Edging completed. Garden cleaned up.", statLabel: "hours of finishing work" },
  { title: "Maintenance handover", description: "Client walked through the garden. Maintenance schedule provided.", statLabel: "month maintenance plan" },
];

const interiorDesignTemplates: MilestoneTemplate[] = [
  { title: "Empty space", description: "Space measured and documented. Design brief finalised with client.", statLabel: "square metres" },
  { title: "Demolition", description: "Existing fixtures removed. Space prepared for new installations.", statLabel: "days of demolition" },
  { title: "Electrical & plumbing", description: "Electrical and plumbing rough-in completed to new layout.", statLabel: "circuits updated" },
  { title: "Flooring", description: "Flooring installed throughout. Material transitions completed.", statLabel: "square metres of flooring" },
  { title: "Walls & ceiling", description: "Plastering, painting, and ceiling work completed.", statLabel: "square metres painted" },
  { title: "Cabinetry & built-ins", description: "All custom cabinetry and built-in furniture installed.", statLabel: "units installed" },
  { title: "Furniture installation", description: "All furniture placed and assembled according to the design plan.", statLabel: "pieces installed" },
  { title: "Lighting", description: "All lighting fixtures installed and commissioned. Dimmers configured.", statLabel: "light points installed" },
  { title: "Décor & finishing", description: "Art, accessories, and finishing details placed. Space styled.", statLabel: "hours of styling" },
  { title: "Reveal", description: "Final reveal completed. Client walked through the finished space.", statLabel: "client satisfaction score" },
];

const roofingTemplates: MilestoneTemplate[] = [
  { title: "Existing roof inspection", description: "Existing roof assessed for damage, leaks, and structural integrity.", statLabel: "defects identified" },
  { title: "Existing roof removal", description: "Old roofing material stripped and safely removed from site.", statLabel: "loads removed" },
  { title: "Structural inspection", description: "Roof structure inspected after removal. Repairs completed.", statLabel: "days to repair" },
  { title: "Underlayment", description: "Waterproof underlayment installed across the full roof area.", statLabel: "square metres covered" },
  { title: "Tile or sheet installation", description: "All roofing tiles or sheets installed and secured.", statLabel: "square metres roofed" },
  { title: "Flashing & sealing", description: "All flashings installed at ridges, valleys, and penetrations. Sealed.", statLabel: "penetrations sealed" },
  { title: "Guttering", description: "New guttering and downpipes installed. Flow tested.", statLabel: "metres of guttering" },
  { title: "Final inspection", description: "Roof inspected for leaks and defects. Water test completed.", statLabel: "days to complete" },
  { title: "Handover", description: "Roof handed over with maintenance documentation. Warranty provided.", statLabel: "year warranty" },
];

const electricalTemplates: MilestoneTemplate[] = [
  { title: "Site assessment", description: "Existing electrical installation assessed. Scope of work confirmed.", statLabel: "circuits assessed" },
  { title: "DB board installation", description: "Distribution board installed and configured with breakers.", statLabel: "circuits" },
  { title: "Conduit installation", description: "All conduit routed and fixed throughout the property.", statLabel: "metres of conduit" },
  { title: "Cable pulling", description: "All cabling pulled through conduit and terminated.", statLabel: "metres of cable" },
  { title: "Outlet & switch fitting", description: "All outlets, switches, and socket plates installed.", statLabel: "points installed" },
  { title: "Lighting installation", description: "All light fittings installed and connected.", statLabel: "light points installed" },
  { title: "Testing & certification", description: "Full electrical test completed. Certificate of compliance issued.", statLabel: "circuits tested" },
  { title: "Handover", description: "Installation handed over with compliance certificate.", statLabel: "year guarantee" },
];

const plumbingTemplates: MilestoneTemplate[] = [
  { title: "Site assessment", description: "Existing plumbing assessed. Scope of work and materials confirmed.", statLabel: "fixtures assessed" },
  { title: "Pipe installation", description: "All supply and waste pipes installed to new layout.", statLabel: "metres of pipe" },
  { title: "Geyser installation", description: "Hot water geyser installed, connected, and pressure valve fitted.", statLabel: "litre capacity" },
  { title: "Fixture installation", description: "All taps, toilets, basins, and showers installed.", statLabel: "fixtures installed" },
  { title: "Pressure testing", description: "All supply lines pressure tested. No leaks detected.", statLabel: "bar test pressure" },
  { title: "Final inspection", description: "Full plumbing inspection completed. All fixtures operational.", statLabel: "days to complete" },
  { title: "Handover", description: "Plumbing handed over with compliance documentation.", statLabel: "year guarantee" },
];

const otherTemplates: MilestoneTemplate[] = [
  { title: "Planning", description: "Project scope defined and agreed. Timeline and budget confirmed.", statLabel: "days of planning" },
  { title: "Preparation", description: "Materials sourced. Team assembled. Site prepared.", statLabel: "team members" },
  { title: "Phase 1", description: "First phase of work completed on schedule.", statLabel: "days to complete" },
  { title: "Phase 2", description: "Second phase completed. Progress reviewed with client.", statLabel: "days to complete" },
  { title: "Phase 3", description: "Third phase completed and signed off.", statLabel: "days to complete" },
  { title: "Finishing", description: "Final details completed. Quality check passed.", statLabel: "snagging items" },
  { title: "Completion", description: "All work completed to specification.", statLabel: "days ahead of schedule" },
  { title: "Handover", description: "Project handed over. Client sign-off received.", statLabel: "client satisfaction score" },
];

export const milestoneTemplates: Record<string, MilestoneTemplate[]> = {
  Construction: constructionTemplates,
  "Solar Installation": solarTemplates,
  Solar: solarTemplates,
  Landscaping: landscapingTemplates,
  "Interior Design": interiorDesignTemplates,
  Roofing: roofingTemplates,
  Electrical: electricalTemplates,
  Plumbing: plumbingTemplates,
  Other: otherTemplates,
};

export function getTemplates(category: string): MilestoneTemplate[] {
  return milestoneTemplates[category] ?? milestoneTemplates["Other"]!;
}
