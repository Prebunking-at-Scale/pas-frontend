import type { Entity } from '~/types/api';

export function getEntityImage(entity: Entity): string | null {
  if (!entity.metadata?.wikidata_info?.claims) {
    return entity.image_url || null;
  }
  
  const claims = entity.metadata.wikidata_info.claims;
  
  // Check if this is a country (has P31 with values indicating country/state)
  const isCountry = claims.P31?.some(claim => 
    claim.label?.toLowerCase().includes('country') ||
    claim.label?.toLowerCase().includes('state') ||
    claim.label?.toLowerCase().includes('republic') ||
    claim.id === 'Q3624078' || // sovereign state
    claim.id === 'Q6256' || // country
    claim.id === 'Q672729' // Islamic Republic
  );
  
  // For countries, prioritize flag (P41) over regular image (P18)
  if (isCountry) {
    // Try P41 (flag image) first for countries
    if (claims.P41 && claims.P41.length > 0 && claims.P41[0].url) {
      return claims.P41[0].url;
    }
    
    // Then try P18 (image)
    if (claims.P18 && claims.P18.length > 0 && claims.P18[0].url) {
      return claims.P18[0].url;
    }
  } else {
    // For non-countries, try P18 (image) first
    if (claims.P18 && claims.P18.length > 0 && claims.P18[0].url) {
      return claims.P18[0].url;
    }
    
    // Then try P41 (flag image)
    if (claims.P41 && claims.P41.length > 0 && claims.P41[0].url) {
      return claims.P41[0].url;
    }
  }
  
  // Try P154 (logo image) for all entities
  if (claims.P154 && claims.P154.length > 0 && claims.P154[0].url) {
    return claims.P154[0].url;
  }
  
  // Fallback to legacy image_url
  return entity.image_url || null;
}

export function getEntityDescription(entity: Entity): string | null {
  if (entity.metadata?.wikidata_info?.descriptions?.en?.value) {
    return entity.metadata.wikidata_info.descriptions.en.value;
  }
  
  // Fallback to legacy description
  return entity.description || null;
}

export function getEntityClass(entity: Entity): string | null {
  if (entity.metadata?.wikidata_info?.claims?.P31 && 
      entity.metadata.wikidata_info.claims.P31.length > 0 &&
      entity.metadata.wikidata_info.claims.P31[0].label) {
    return entity.metadata.wikidata_info.claims.P31[0].label;
  }
  
  // Fallback to entity type from metadata
  if (entity.metadata?.entity_type) {
    return entity.metadata.entity_type;
  }
  
  // Fallback to legacy type
  return entity.type || null;
}

export function getEntityType(entity: Entity): string | null {
  // First try to get the class/instance type
  const entityClass = getEntityClass(entity);
  if (entityClass) {
    return entityClass;
  }
  
  // Fallback to metadata entity_type
  if (entity.metadata?.entity_type) {
    return entity.metadata.entity_type;
  }
  
  // Finally fallback to legacy type
  return entity.type || null;
}