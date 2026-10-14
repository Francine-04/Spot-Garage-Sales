export const dashboardMeta = { source: "Demonstration dataset", currency: "PHP", year: 2024, isDemo: true };
export const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const regions = ["Naga City", "North Naga", "South Naga", "Other Areas"];
export const categories = ["Burgers", "Specialty Drinks", "Fries", "Rice Meals", "Snacks", "Desserts"];
export const payments = ["Cash", "GCash", "Card"];
export const demoMargins = [0.27,0.28,0.29,0.28,0.30,0.31,0.30,0.32,0.31,0.33,0.30,0.29];

const baseSales = [62000,69000,76000,84000,91000,87000,96000,93000,105000,124000,112000,101000];

export const salesData = months.flatMap((month, monthIndex) =>
  regions.flatMap((region, regionIndex) =>
    categories.map((category, categoryIndex) => {
      const categoryWeight = [0.30,0.22,0.15,0.13,0.11,0.09][categoryIndex];
      const regionWeight = [0.40,0.25,0.20,0.15][regionIndex];
      const variation = 0.92 + (((monthIndex + 2) * (categoryIndex + 3) + regionIndex) % 9) / 50;
      const netSales = Math.round(baseSales[monthIndex] * categoryWeight * regionWeight * 4.2 * variation);
      const averageSale = 175 + categoryIndex * 18 + regionIndex * 6;
      const receipts = Math.max(1, Math.round(netSales / averageSale));
      return {
        id: `${monthIndex}-${regionIndex}-${categoryIndex}`,
        year: 2024, month, monthIndex, region, category,
        paymentType: payments[(monthIndex + regionIndex + categoryIndex) % payments.length],
        receipts, netSales, averageSale,
        itemsSold: Math.round(receipts * (1.65 + categoryIndex * 0.07))
      };
    })
  )
);
