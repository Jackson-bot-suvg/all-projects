export const getBrandImage = (brand: string): string => {
  // Capitalize first letter of the brand name
  const formattedBrand = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
  
  switch (formattedBrand) {
    case "Blackberry":
      return '/images/BlackBerry.jpeg';
    case "Htc":
      return '/images/HTC.jpeg';
    case "Huawei":
      return '/images/Huawei.jpeg';
    case "Lg":
      return '/images/LG.jpeg';
    case "Motorola":
      return '/images/Motorola.jpeg';
    case "Nokia":
      return '/images/Nokia.jpeg';
    case "Samsung":
      return '/images/Samsung.jpeg';
    case "Sony":
      return '/images/Sony.jpeg';
    default:
      return '/images/Apple.jpeg';
  }
}; 