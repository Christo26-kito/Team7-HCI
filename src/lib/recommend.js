/**
 * recommend.js — "Recommend for You" scoring.
 *
 * Scores every product against the user's onboarding preferences
 * (favourite brands / categories / colours) plus a soft popularity signal.
 * Pure function: no React, easy to unit-test, easy to swap for a real
 * recsys backend later.
 */
import { PRODUCTS } from '../data/products'

const WEIGHTS = {
  brand: 3,
  category: 2,
  color: 1.5,
  gender: 1,
}

/**
 * @param {Array} products — product list to rank
 * @param {object} prefs — { brands: [], categories: [], colors: [], gender: 'men'|'women' }
 * @param {number} limit
 * @returns ranked products
 */
export function recommend(products = PRODUCTS, prefs = {}, limit = 8) {
  const p = {
    brands: Array.isArray(prefs.brands) ? prefs.brands : [],
    categories: Array.isArray(prefs.categories) ? prefs.categories : [],
    colors: Array.isArray(prefs.colors) ? prefs.colors : [],
    gender: prefs.gender || null,
  }
  const hasPrefs = p.brands.length || p.categories.length || p.colors.length || p.gender

  return [...products]
    .filter((prod) => prod.status !== 'soon')
    .map((prod) => {
      let score = 0
      if (hasPrefs) {
        if (p.brands.includes(prod.brand)) score += WEIGHTS.brand
        if (p.categories.includes(prod.category)) score += WEIGHTS.category
        if (p.colors.includes(prod.colorKey)) score += WEIGHTS.color
        if (p.gender && (prod.gender === p.gender || prod.gender === 'unisex')) score += WEIGHTS.gender
      }
      // soft popularity tie-breaker so "no prefs" still yields a sensible list
      score += prod.rating * 0.4 + Math.min(prod.likes, 3000) / 3000
      return { prod, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.prod)
}
