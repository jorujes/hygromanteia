"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { CalendarIcon, MapPinIcon } from "lucide-react"
import tzLookup from 'tz-lookup'
import { DateTime } from 'luxon'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Location {
  latitude: number
  longitude: number
  city?: string
  state?: string
  country?: string
  timezone: string
}

interface LocationSuggestion {
  display_name: string
  lat: string
  lon: string
  address: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    state?: string
    country?: string
  }
  status: string
}

interface PlanetaryHourInfo {
  start: Date
  end: Date
  planet: string
  hourNumber: number
  city: string
  state: string
  country: string
  latitude: number
  longitude: number
  timezone?: string
}

interface SunriseSunsetData {
  results: {
    sunrise: string
    sunset: string
    solar_noon: string
    day_length: string
    civil_twilight_begin: string
    civil_twilight_end: string
    nautical_twilight_begin: string
    nautical_twilight_end: string
    astronomical_twilight_begin: string
    astronomical_twilight_end: string
  }
  status: string
}

interface LocalTimeData {
  hours: number
  minutes: number
  seconds: number
}

interface PlanetaryHourData {
  Dia: string
  Hora: string
  Planeta: string
  Harleianus: string
  Monacensis: string
  Gennadianus: string
}

const DAYS_PT = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const DAYS_CLASSICAL = [
  "Day of the Sun",
  "Day of the Moon", 
  "Day of Mars",
  "Day of Mercury",
  "Day of Jupiter",
  "Day of Venus",
  "Day of Saturn",
]
// Chaldean order of the planets
const PLANETS = ["Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars"]

// Corresponding astrological symbols
const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉",
  Moon: "☾",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
}

// Correct prepositions for each planet
const PLANET_PREPOSITIONS: Record<string, string> = {
  Sun: "of the Sun",
  Moon: "of the Moon",
  Mercury: "of Mercury",
  Venus: "of Venus",
  Mars: "of Mars",
  Jupiter: "of Jupiter",
  Saturn: "of Saturn",
}

// Correct mapping: day of week -> ruling planet index in PLANETS array
const DAY_TO_PLANET_INDEX = [
  0, // Sunday = Sun (index 0)
  3, // Monday = Moon (index 3)
  6, // Tuesday = Mars (index 6)
  2, // Wednesday = Mercury (index 2)
  5, // Thursday = Jupiter (index 5)
  1, // Friday = Venus (index 1)
  4, // Saturday = Saturn (index 4)
]

const MONTHS_PT = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

// Helper function to fetch location by IP, moved outside the component
async function fetchLocationByIP(): Promise<Location | null> {
  try {
    // Using a reliable IP geolocation service
    const response = await fetch("https://ipapi.co/json/")
    if (!response.ok) {
      throw new Error(`IP API request failed with status ${response.status}`)
    }
    const data = await response.json()
    if (data.error) {
      throw new Error(`IP API error: ${data.reason}`)
    }
    const lat = parseFloat(data.latitude)
    const lon = parseFloat(data.longitude)
    if (isNaN(lat) || isNaN(lon)) {
      throw new Error("Invalid coordinates from IP API")
    }
    return {
      latitude: lat,
      longitude: lon,
      city: data.city || "Unknown City",
      state: data.region || "Unknown State",
      country: data.country_name || "Unknown Country",
      timezone: data.timezone || tzLookup(lat, lon),
    }
  } catch (error) {
    console.error("IP-based geolocation failed:", error)
    return null
  }
}

export default function HygromanteiApp() {
  const [location, setLocation] = useState<Location | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentHourInfo, setCurrentHourInfo] = useState<PlanetaryHourInfo | null>(null)
  const [sunriseSunsetData, setSunriseSunsetData] = useState<{ sunrise: DateTime; sunset: DateTime } | null>(null)
  const [loading, setLoading] = useState(true)
  const [geolocationError, setGeolocationError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isGeolocationAvailable, setIsGeolocationAvailable] = useState(true)
  const [selectedHourIndex, setSelectedHourIndex] = useState<number | null>(null)
  const [allPlanetaryHours, setAllPlanetaryHours] = useState<PlanetaryHourInfo[]>([])
  const [isManuallyNavigating, setIsManuallyNavigating] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [planetaryHourData, setPlanetaryHourData] = useState<PlanetaryHourData[]>([])
  const [currentHourRecommendations, setCurrentHourRecommendations] = useState<PlanetaryHourData | null>(null)
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false)
  const [locationInput, setLocationInput] = useState("")
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [citySearch, setCitySearch] = useState("")
  const [citySuggestions, setCitySuggestions] = useState<any[]>([])
  const [isLocating, setIsLocating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasInitialized = useRef(false)
  const [isManualLocation, setIsManualLocation] = useState(false)

  // Load planetary hours data
  useEffect(() => {
    const loadPlanetaryData = async () => {
      try {
        const response = await fetch('/data/planetary_hours.json')
        const data: PlanetaryHourData[] = await response.json()
        setPlanetaryHourData(data)
      } catch (error) {
        console.error('Error loading planetary hours data:', error)
      }
    }

    loadPlanetaryData()
  }, [])

  // Check geolocation permission status
  const checkGeolocationPermission = useCallback(async () => {
    if (!navigator.permissions) {
      return 'unknown'
    }
    
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' })
      
      // macOS bug workaround: Safari/Chrome on macOS often returns 'prompt' even when denied
      const isMacOS = navigator.userAgent.includes('Mac OS X')
      if (isMacOS && result.state === 'prompt') {
        console.log('macOS detected - permission state may be unreliable due to CoreLocation issues')
      }
      
      return result.state // 'granted', 'denied', 'prompt'
    } catch (error) {
      console.log("Error checking geolocation permission:", error)
      return 'unknown'
    }
  }, [])

  // Function to request geolocation in an optimized way
  const requestGeolocation = useCallback(async () => {
    setIsDetectingLocation(true)
    
    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.log("Geolocation not supported by browser")
      setIsGeolocationAvailable(false)
      setGeolocationError("Geolocation not supported by this browser.")
      setIsDetectingLocation(false)
      return
    }

    // Check permission status first
    const permissionState = await checkGeolocationPermission()
    console.log("Geolocation permission status:", permissionState)

         if (permissionState === 'denied') {
       setGeolocationError("Geolocation permission denied. Use the location icon to manually enter your city.")
       setIsDetectingLocation(false)
       return
     }

    // Optimized settings for different scenarios (macOS-friendly)
    const options = {
      enableHighAccuracy: true, // Try to get more precise location first
      timeout: 15000, // Longer timeout for macOS (15 seconds)
      maximumAge: 300000, // Cache for 5 minutes
    }

    const successCallback = async (position: GeolocationPosition) => {
      const lat = position.coords.latitude
      const lng = position.coords.longitude

      console.log("Successfully upgraded to precise GPS location:", { lat, lng, accuracy: position.coords.accuracy })

      try {
        // Use reverse geocoding API to get city
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        const newTimezone = tzLookup(lat, lng)
        
        const newLocation: Location = {
          latitude: lat,
          longitude: lng,
          city: data.city || data.locality || "Location detected",
          state: data.principalSubdivision || "",
          country: data.countryName || "",
          timezone: newTimezone,
        }

        // Just set the location - don't force date
        setLocation(newLocation)
        setGeolocationError(null) // Clear any previous error
        setIsDetectingLocation(false)
      } catch (error) {
        console.log("Error getting city name from GPS, keeping IP-based info:", error)
        // Keep the more precise coordinates, but maybe update the error state
        setLocation(prev => prev ? { ...prev, latitude: lat, longitude: lng } : null)
        setGeolocationError("Precise location found, but could not get city name.")
        setIsDetectingLocation(false)
      }
    }

    const errorCallback = (error: GeolocationPositionError) => {
      // This is no longer critical, as we may already have a location from IP.
      // We just log that the upgrade to GPS failed.
      console.log(`Failed to upgrade to precise GPS location: ${error.message} (Code: ${error.code})`)
      setIsDetectingLocation(false)
    }

    // macOS CoreLocation bug workaround - add retry logic
    let attempts = 0
    const maxAttempts = 2
    
    const attemptGeolocation = (useHighAccuracy: boolean) => {
      const currentOptions = {
        ...options,
        enableHighAccuracy: useHighAccuracy,
        timeout: useHighAccuracy ? 15000 : 10000,
      }
      
      navigator.geolocation.getCurrentPosition(
        successCallback,
        (error) => {
          attempts++
          console.log(`GPS attempt ${attempts} failed:`, error.message, `(accuracy: ${useHighAccuracy ? 'high' : 'low'})`)
          
          // macOS specific: Try different strategies
          if (attempts < maxAttempts) {
            if (useHighAccuracy) {
              console.log("Retrying with low accuracy GPS...")
              setTimeout(() => attemptGeolocation(false), 500) // Small delay before retry
            } else {
              errorCallback(error)
            }
          } else {
            console.log("All GPS attempts failed. Keeping IP-based location.")
            errorCallback(error)
          }
        },
        currentOptions
      )
    }
    
    // Start with high accuracy
    attemptGeolocation(true)
    
  }, [checkGeolocationPermission])

  const fetchAndSetLocation = useCallback(async () => {
    setIsLocating(true)
    setGeolocationError(null)

    console.log("Attempting IP-based geolocation as primary source...")
    const ipLocation = await fetchLocationByIP()

    if (ipLocation) {
      console.log("Success! Using IP-based location:", ipLocation)
      setLocation(ipLocation)
      
      console.log("Attempting to upgrade to precise GPS location...")
      await requestGeolocation()
    } else {
      console.error("FATAL: IP-based geolocation failed. App cannot determine location.")
      setGeolocationError("Could not determine your location automatically. Please set it manually using the pin icon.")
    }
    setIsLocating(false)
  }, [requestGeolocation]);

  // Get location on mount: IP-first, then upgrade to GPS
  useEffect(() => {
    const initializeLocation = async () => {
      // If user has a manually saved location, use it and stop.
      const savedLocation = localStorage.getItem('hygromanteia-manual-location')
      if (savedLocation) {
        try {
          console.log("Found manually saved location in storage.")
          const parsedLocation = JSON.parse(savedLocation)
          setLocation(parsedLocation)
          setIsManualLocation(true)
          setLoading(false)
          return
        } catch (error) {
          console.error('Error loading saved location, proceeding with detection.', error)
          localStorage.removeItem('hygromanteia-manual-location')
        }
      }

      setLoading(true)
      await fetchAndSetLocation()
      setLoading(false)
    }

    // Prevent re-running on dev hot reloads
    if (!hasInitialized.current) {
      hasInitialized.current = true
      initializeLocation()
    }
  }, [fetchAndSetLocation])

  // Function to search location by name
  const searchLocationByName = useCallback(async (locationName: string) => {
    if (!locationName.trim()) return

    setIsSearchingLocation(true)
    
    try {
      // Use OpenStreetMap Nominatim API which is more reliable
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1&addressdetails=1`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.length > 0) {
        const result = data[0]
        const displayParts = result.display_name.split(',').map((part: string) => part.trim())
        
        const newLocation: Location = {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          city: displayParts[0] || locationName,
          state: result.address?.state || displayParts[1] || "",
          country: result.address?.country || "Brazil",
          timezone: tzLookup(parseFloat(result.lat), parseFloat(result.lon)),
        }

        setLocation(newLocation)
        setIsLocationPickerOpen(false)
        setLocationInput("")
        // Save manual location to localStorage
        localStorage.setItem('hygromanteia-manual-location', JSON.stringify(newLocation))
        setIsManualLocation(true)
      } else {
        alert("Location not found. Try again with another name or be more specific (e.g. 'New York, USA').")
      }
    } catch (error) {
      console.error("Error searching location:", error)
      alert("Error searching location. Check your connection and try again.")
    } finally {
      setIsSearchingLocation(false)
    }
  }, [])

  // Calculate approximate sunrise and sunset times based on latitude
  const calculateApproximateSunriseSunset = (latitude: number): { sunrise: Date; sunset: Date } => {
    const today = new Date()
    const month = today.getMonth()

    // Approximate seasonal adjustments (minutes before/after 6am/6pm)
    const seasonalAdjustment = [
      { sr: -60, ss: 60 }, // January
      { sr: -40, ss: 40 }, // February
      { sr: -20, ss: 20 }, // March
      { sr: 0, ss: 0 }, // April
      { sr: 20, ss: -20 }, // May
      { sr: 30, ss: -30 }, // June
      { sr: 20, ss: -20 }, // July
      { sr: 0, ss: 0 }, // August
      { sr: -20, ss: 20 }, // September
      { sr: -40, ss: 40 }, // October
      { sr: -60, ss: 60 }, // November
      { sr: -70, ss: 70 }, // December
    ]

    // Adjustment based on latitude (the farther from the equator, the greater the seasonal variation)
    const latitudeAdjustment = (Math.abs(latitude) / 90) * 60 // up to 60 minutes adjustment at the extreme

    // Calculate base times (6am and 6pm)
    const sunrise = new Date(today)
    sunrise.setHours(6, 0, 0, 0)

    const sunset = new Date(today)
    sunset.setHours(18, 0, 0, 0)

    // Apply adjustments
    const srAdjustment = seasonalAdjustment[month].sr * (latitudeAdjustment / 60)
    const ssAdjustment = seasonalAdjustment[month].ss * (latitudeAdjustment / 60)

    // In the southern hemisphere, invert seasonal adjustments
    const finalSrAdjustment = latitude < 0 ? -srAdjustment : srAdjustment
    const finalSsAdjustment = latitude < 0 ? -ssAdjustment : ssAdjustment

    sunrise.setMinutes(sunrise.getMinutes() + finalSrAdjustment)
    sunset.setMinutes(sunset.getMinutes() + finalSsAdjustment)

    return { sunrise, sunset }
  }

  // Get sunrise and sunset times with timezone correction
  useEffect(() => {
    const fetchSunriseSunset = async () => {
      if (!location) return

      try {
        const today = DateTime.now().setZone(location.timezone)
        const formattedDate = today.toFormat("yyyy-MM-dd")

        console.log(
          `Fetching sunrise/sunset data for: ${location.latitude}, ${location.longitude}, date: ${formattedDate} in timezone ${location.timezone}`
        )

        // Fetch sunrise/sunset data
        const response = await fetch(
          `https://api.sunrise-sunset.org/json?lat=${location.latitude}&lng=${location.longitude}&date=${formattedDate}&formatted=0`
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log("Sunrise-sunset API response:", data)

        if (data.results && data.status === "OK") {
          // As strings da API são sempre em UTC. O Luxon fará a mágica.
          const sunriseUTC = DateTime.fromISO(data.results.sunrise, {
            zone: "utc",
          })
          const sunsetUTC = DateTime.fromISO(data.results.sunset, {
            zone: "utc",
          })

          // Convert to the correct location timezone
          const sunriseLocal = sunriseUTC.setZone(location.timezone)
          const sunsetLocal = sunsetUTC.setZone(location.timezone)

          console.log(
            "Sunrise (local time):",
            sunriseLocal.toFormat("HH:mm:ss")
          )
          console.log(
            "Sunset (local time):",
            sunsetLocal.toFormat("HH:mm:ss")
          )

          setSunriseSunsetData({ sunrise: sunriseLocal, sunset: sunsetLocal })
          setApiError(null)
        } else {
          throw new Error("API returned invalid data or error status.")
        }
      } catch (error) {
        console.log("Error getting sunrise/sunset times:", error)
        setApiError(`${error}`)

        // The fallback to approximate calculation can be maintained if desired,
        // but the API is generally reliable. For now, we just log the error.
        setSunriseSunsetData(null) // Clear old data
      }
    }

    if (location) {
      fetchSunriseSunset()
    }
  }, [location])

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Calculate planetary hours based on actual sunrise/sunset times
  const calculatePlanetaryHours = useCallback((date: Date): PlanetaryHourInfo[] => {
    if (!sunriseSunsetData || !location) return []

    const { sunrise, sunset } = sunriseSunsetData
    const dateToCalculate = DateTime.fromJSDate(date, {
      zone: location.timezone,
    })

    // Ensure sunrise and sunset dates match the selected day
    const todaySunrise = sunrise.set({
      year: dateToCalculate.year,
      month: dateToCalculate.month,
      day: dateToCalculate.day,
    })
    const todaySunset = sunset.set({
      year: dateToCalculate.year,
      month: dateToCalculate.month,
      day: dateToCalculate.day,
    })

    const dayDuration = todaySunset.diff(todaySunrise)
    const nightDuration = dayDuration.negate().plus({ hours: 24 })

    const dayHourDuration = dayDuration.as("milliseconds") / 12
    const nightHourDuration = nightDuration.as("milliseconds") / 12

    const hours: PlanetaryHourInfo[] = []
    const dayOfWeek = dateToCalculate.weekday % 7 // Luxon weekday: 1=Mon, 7=Sun. Adjust to 0=Sun.

    // Get the ruling planet index for the day
    const firstPlanetIndex = DAY_TO_PLANET_INDEX[dayOfWeek]

    // Day hours (1-12)
    for (let i = 0; i < 12; i++) {
      const start = todaySunrise.plus({ milliseconds: i * dayHourDuration })
      const end = todaySunrise.plus({
        milliseconds: (i + 1) * dayHourDuration,
      })
      const planetIndex = (firstPlanetIndex + i) % 7

      hours.push({
        start: start.toJSDate(),
        end: end.toJSDate(),
        planet: PLANETS[planetIndex],
        hourNumber: i + 1,
        city: location.city || "",
        state: location.state || "",
        country: location.country || "Brazil",
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,
      })
    }

    // Night hours (13-24)
    for (let i = 0; i < 12; i++) {
      const start = todaySunset.plus({ milliseconds: i * nightHourDuration })
      const end = todaySunset.plus({
        milliseconds: (i + 1) * nightHourDuration,
      })
      const planetIndex = (firstPlanetIndex + 12 + i) % 7

      hours.push({
        start: start.toJSDate(),
        end: end.toJSDate(),
        planet: PLANETS[planetIndex],
        hourNumber: i + 13,
        city: location.city || "",
        state: location.state || "",
        country: location.country || "Brazil",
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,
      })
    }

    return hours
  }, [sunriseSunsetData, location])

  // Encontrar hora planetária atual
  useEffect(() => {
    if (location && sunriseSunsetData) {
      // Usar a data selecionada, mas com a hora atual do dia para comparações
      const dateToUse = new Date(selectedDate)
      dateToUse.setHours(currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds())
      
      const planetaryHours = calculatePlanetaryHours(dateToUse)
      setAllPlanetaryHours(planetaryHours)

      // Obter o horário atual na localização selecionada
      const currentTimeInLocationTimezone = DateTime.now()
        .setZone(location.timezone)
        .toJSDate()

      // Encontrar a hora planetária atual usando o horário local da cidade
      let currentHour = null
      let currentHourIndex = -1
      for (let i = 0; i < planetaryHours.length; i++) {
        const hour = planetaryHours[i]
        if (currentTimeInLocationTimezone >= hour.start && currentTimeInLocationTimezone < hour.end) {
          currentHour = hour
          currentHourIndex = i
          break
        }
      }

      // Verificar se estamos vendo a data de hoje
      const todayInLocation = location?.timezone 
        ? DateTime.now().setZone(location.timezone).toJSDate()
        : new Date()
      const isViewingToday = selectedDate.toDateString() === todayInLocation.toDateString()

      if (currentHour && isViewingToday) {
        // Para a data de hoje, usar a lógica de hora atual vs navegação manual
        if (!isManuallyNavigating) {
          setCurrentHourInfo(currentHour)
          setSelectedHourIndex(currentHourIndex)
        } else {
          // Se está navegando manualmente, manter a hora selecionada
          if (selectedHourIndex !== null && selectedHourIndex < planetaryHours.length) {
            setCurrentHourInfo(planetaryHours[selectedHourIndex])
          } else {
            // Fallback para hora atual se índice inválido
            setCurrentHourInfo(currentHour)
            setSelectedHourIndex(currentHourIndex)
          }
        }
      } else if (planetaryHours.length > 0) {
        // Para outras datas, sempre permitir navegação livre
        if (selectedHourIndex !== null && selectedHourIndex < planetaryHours.length) {
          setCurrentHourInfo(planetaryHours[selectedHourIndex])
        } else {
          // Fallback para a primeira hora se índice inválido
          setCurrentHourInfo(planetaryHours[0])
          setSelectedHourIndex(0)
        }
      }
      setLoading(false)
    }
  }, [currentTime, location, sunriseSunsetData, selectedHourIndex, isManuallyNavigating, selectedDate])

  // Atualizar recomendações da hora atual
  useEffect(() => {
    if (currentHourInfo && planetaryHourData.length > 0) {
      const dayName = DAYS_PT[selectedDate.getDay()]
      const recommendations = getHourRecommendations(dayName, currentHourInfo.hourNumber)
      setCurrentHourRecommendations(recommendations)
    }
  }, [currentHourInfo, planetaryHourData, selectedDate])

  const getCurrentDay = (): string => {
    if (!location?.timezone) return ""
    const dateInLocation = DateTime.fromJSDate(selectedDate).setZone(location.timezone)
    const dayIndex = dateInLocation.weekday % 7
    return DAYS_CLASSICAL[dayIndex]
  }

  const getFormattedDate = (): string => {
    if (!location?.timezone) return "Calculating date..."

    // Use Luxon to format the date in the correct location timezone
    const dateInLocation = DateTime.fromJSDate(selectedDate).setZone(location.timezone)

    // Luxon weekday: 1=Mon, 7=Sun. Our array is 0=Sun.
    const dayOfWeekIndex = dateInLocation.weekday % 7 
    const dayOfWeek = DAYS_PT[dayOfWeekIndex]
    const day = dateInLocation.day
    const month = MONTHS_PT[dateInLocation.month - 1] // Month in Luxon is 1-based
    const year = dateInLocation.year

    return `${dayOfWeek}, ${month} ${day}, ${year}`
  }

  const getFormattedLocation = (): string => {
    if (!location) return "Location not detected"

    const city = location.city || "Unidentified city"
    const state = location.state || ""
    const country = location.country || "Brazil"

    // If we have state, show in "City - State" format
    if (state) {
      return `${city} - ${state} - ${country}`
    }

    // If no state, show only city
    return city
  }

  const formatTime = (date: Date): string => {
    if (!location?.timezone) return "--:--"
    return DateTime.fromJSDate(date)
      .setZone(location.timezone)
      .toFormat("HH:mm")
  }

  // E.g.: 1st, 2nd, 10th hour
  const formatOrdinal = (n: number): string => {
    const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'
    return `${n}${suffix}`
  }

  // Function to get correct preposition for planet
  const getPlanetWithPreposition = (planet: string): string => {
    return PLANET_PREPOSITIONS[planet] || `of ${planet}`
  }

  // Function to fetch current hour recommendations
  const getHourRecommendations = (dayName: string, hourNumber: number): PlanetaryHourData | null => {
    if (planetaryHourData.length === 0) return null
    
    const hourKey = `${hourNumber}ª`
    
    return planetaryHourData.find(item => 
      item.Dia === dayName && item.Hora === hourKey
    ) || null
  }

  // Functions to navigate between hours
  const goToPreviousHour = () => {
    if (selectedHourIndex !== null && selectedHourIndex > 0) {
      setIsManuallyNavigating(true)
      setSelectedHourIndex(selectedHourIndex - 1)
    }
  }

  const goToNextHour = () => {
    if (selectedHourIndex !== null && selectedHourIndex < allPlanetaryHours.length - 1) {
      setIsManuallyNavigating(true)
      setSelectedHourIndex(selectedHourIndex + 1)
    }
  }

  const resetToCurrentHour = useCallback(() => {
    if (!location || !sunriseSunsetData) return
    
    // Obter a hora atual na localização
    const nowInLocation = DateTime.now().setZone(location.timezone)
    const currentTimeJS = nowInLocation.toJSDate()
    
    // Tentar encontrar a hora planetária atual em 3 dias possíveis: ontem, hoje e amanhã
    const daysToCheck = [-1, 0, 1]
    
    for (const dayOffset of daysToCheck) {
      const checkDate = nowInLocation.plus({ days: dayOffset }).toJSDate()
      const hoursForDay = calculatePlanetaryHours(checkDate)
      
      // Verificar se a hora atual está neste dia
      for (let i = 0; i < hoursForDay.length; i++) {
        const hour = hoursForDay[i]
        const isCurrentHour = currentTimeJS >= hour.start && currentTimeJS < hour.end
        
        if (isCurrentHour) {
          // Encontramos! Definir a data e hora corretas
          setSelectedDate(checkDate)
          setAllPlanetaryHours(hoursForDay)
          setCurrentHourInfo(hour)
          setSelectedHourIndex(i)
          setIsManuallyNavigating(false)
          return
        }
      }
    }
    
    // Fallback: se não encontrar (não deveria acontecer), usar a data atual
    setSelectedDate(currentTimeJS)
    setIsManuallyNavigating(false)
    setSelectedHourIndex(null)
  }, [location, sunriseSunsetData, calculatePlanetaryHours])

  // Inicialização: encontrar a hora planetária correta quando o app carrega
  useEffect(() => {
    if (location && sunriseSunsetData && !hasInitialized.current) {
      // Na primeira vez que temos dados, chamar resetToCurrentHour
      hasInitialized.current = true
      resetToCurrentHour()
    }
  }, [location, sunriseSunsetData, resetToCurrentHour])

  // Quando a localização muda, ir automaticamente para a hora atual da nova localização
  useEffect(() => {
    if (location && sunriseSunsetData) {
      resetToCurrentHour()
    }
  }, [location?.timezone, sunriseSunsetData, resetToCurrentHour])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setIsDatePickerOpen(false)
      
      // Comparar datas de forma segura com fuso horário
      const dateInLocation = DateTime.fromJSDate(date).setZone(location?.timezone || 'utc')
      const todayInLocation = DateTime.now().setZone(location?.timezone || 'utc')
      const isToday = dateInLocation.hasSame(todayInLocation, 'day')
      
      if (isToday) {
        // Se voltou para hoje, voltar ao modo automático
        setIsManuallyNavigating(false)
        setSelectedHourIndex(null)
      } else {
        // Se é outra data, permitir navegação manual e começar na primeira hora
        setIsManuallyNavigating(true)
        setSelectedHourIndex(0)
      }
    }
  }

  // Função handleLocationSubmit removida - agora usamos autocomplete

  // Função para tentar detectar localização novamente (acionada pelo usuário)
  const retryGeolocation = useCallback(async () => {
    // Limpar estado de localização manual
    setIsManualLocation(false)
    
    // Resetar para modo automático (vai para hora atual quando localização mudar)
    setIsManuallyNavigating(false)
    setSelectedHourIndex(null)
    
    // Remover localização manual salva
    localStorage.removeItem('hygromanteia-manual-location')
    
    // Fechar popover
    setIsLocationPickerOpen(false)
    
    // Tentar detectar localização usando o novo fluxo
    await fetchAndSetLocation()
  }, [fetchAndSetLocation])

  // Função para usar localização padrão permanentemente
  const useDefaultPermanently = useCallback(() => {
    localStorage.setItem('hygromanteia-location-preference', 'default')
    setIsManualLocation(true)
  }, [])

  // Função para buscar sugestões de autocomplete
  const searchLocationSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoadingSuggestions(true)

    try {
      // Usar API do Nominatim (OpenStreetMap) para autocomplete
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Hygromanteia App'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Erro na busca de sugestões')
      }

      const data = await response.json()
      setLocationSuggestions(data)
      setShowSuggestions(true)
      setSelectedSuggestionIndex(-1) // Reset seleção
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error)
      setLocationSuggestions([])
      setShowSuggestions(false)
      setSelectedSuggestionIndex(-1)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [])

  // Função para selecionar uma sugestão
  const selectLocationSuggestion = useCallback((suggestion: LocationSuggestion) => {
    // Marcar que o usuário escolheu manualmente uma localização
    setIsManualLocation(true)
    
    // Extrair nome da cidade de forma mais inteligente
    const city = suggestion.address.city || 
                 suggestion.address.town || 
                 suggestion.address.village || 
                 suggestion.address.municipality ||
                 // Pegar a primeira parte do display_name como fallback
                 suggestion.display_name.split(',')[0].trim()
                 
    const state = suggestion.address.state || ''
    const country = suggestion.address.country || ''

    const newTimezone = tzLookup(parseFloat(suggestion.lat), parseFloat(suggestion.lon))
    
    const newLocation: Location = {
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      city: city,
      state: state || country,
      country: country,
      timezone: newTimezone,
    }

    // Não forçar data específica - deixar o resetToCurrentHour encontrar o dia correto
    setIsManuallyNavigating(false) // Voltar ao modo automático
    setSelectedHourIndex(null) // Reset para encontrar a hora atual

    setLocation(newLocation)
    setLocationInput("")
    setLocationSuggestions([])
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)
    setIsLocationPickerOpen(false)
    
    // Salvar preferência de localização manual
    localStorage.setItem('hygromanteia-location-preference', 'manual')
    localStorage.setItem('hygromanteia-manual-location', JSON.stringify(newLocation))
  }, [])

  // Debounce para busca de sugestões
  useEffect(() => {
    if (!locationInput || locationInput.length < 3) {
      setLocationSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timeoutId = setTimeout(() => {
      searchLocationSuggestions(locationInput)
    }, 500) // 500ms de delay

    return () => clearTimeout(timeoutId)
  }, [locationInput, searchLocationSuggestions])

  // Função para lidar com mudanças no input de localização
  const handleLocationInputChange = useCallback((value: string) => {
    setLocationInput(value)
    setSelectedSuggestionIndex(-1) // Reset seleção
    if (value.length === 0) {
      setLocationSuggestions([])
      setShowSuggestions(false)
    }
  }, [])

  // Função para lidar com teclas no input de localização
  const handleLocationInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || locationSuggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < locationSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : locationSuggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < locationSuggestions.length) {
          selectLocationSuggestion(locationSuggestions[selectedSuggestionIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }, [showSuggestions, locationSuggestions, selectedSuggestionIndex, selectLocationSuggestion])

  // Calcular progresso da hora atual (0-100%)
  const calculateHourProgress = (): number => {
    if (!currentHourInfo || !location?.timezone) return 0
    
    // Usar o horário atual na cidade selecionada
    const now = DateTime.now()
      .setZone(location.timezone)
      .toJSDate()
      .getTime()
      
    const start = currentHourInfo.start.getTime()
    const end = currentHourInfo.end.getTime()
    
    if (now < start) return 0
    if (now > end) return 100
    
    const progress = ((now - start) / (end - start)) * 100
    return Math.max(0, Math.min(100, progress))
  }

  // Render manuscripts recommendations
  const renderRecommendations = () => {
    if (!currentHourRecommendations) return null

    const recommendations = [
      { name: "Harleianus", text: currentHourRecommendations.Harleianus },
      { name: "Monacensis", text: currentHourRecommendations.Monacensis },
      { name: "Gennadianus", text: currentHourRecommendations.Gennadianus }
    ]

    if (recommendations.length === 0) return null

    return (
      <div className="mt-8 mx-auto">
        <h3 className="text-xl font-medium text-gray-800 mb-4 text-center">Manuscript Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="p-4">
              <p className="text-base font-bold italic text-gray-700 mb-2">{rec.name}</p>
              <p className="text-base text-gray-600 leading-relaxed">{rec.text}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading || !currentHourInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-800 font-normal">Calculating...</p>
          {geolocationError && <p className="text-sm text-gray-500 mt-2">{geolocationError}</p>}
          {apiError && <p className="text-sm text-gray-500 mt-2">Using approximate times</p>}
          {!isGeolocationAvailable && (
            <p className="text-sm text-gray-500 mt-2">Geolocation not supported. Using default location.</p>
          )}
        </div>
      </div>
    )
  }

  const currentDay = getCurrentDay()
  const dayPlanetName = PLANETS[DAY_TO_PLANET_INDEX[selectedDate.getDay()]]
  const daySymbol = PLANET_SYMBOLS[dayPlanetName]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative overflow-hidden">
      {/* Ornate frame background */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden md:overflow-visible">
        <div 
          className="w-full max-w-7xl h-full max-h-[100vh] bg-contain bg-center bg-no-repeat opacity-30 transition-transform duration-500 ease-in-out transform-gpu rotate-90 scale-[2.2] md:rotate-0 md:scale-100"
          style={{
            backgroundImage: "url('/background3.svg')",
            filter: "sepia(50%) saturate(130%) hue-rotate(10deg) brightness(1.2)"
          }}
        />
      </div>

      {/* Data no canto superior esquerdo */}
      <div className="absolute top-4 left-4 text-left z-20">
        <div className="flex items-center gap-2">
          <p className="text-sm md:text-base text-gray-600 tracking-tight">{getFormattedDate()}</p>
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 hover:bg-gray-100"
                title="Select date"
              >
                <CalendarIcon className="h-4 w-4 text-gray-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Conteúdo principal centralizado dentro da moldura */}
      <div className="flex items-center justify-center h-screen relative z-10">
        <div className="text-center max-w-xs sm:max-w-sm md:max-w-4xl mx-auto px-4 md:px-8 mt-16">
          {/* Frame content area - positioned to fit within the ornate border */}
          <div className="p-4 md:p-10 my-12 relative">
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="flex items-center justify-center gap-4">
              {/* Controles de navegação */}
              <div className="flex items-center gap-1">
                <Button
                  onClick={goToPreviousHour}
                  disabled={selectedHourIndex === 0}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  title="Previous hour"
                >
                  <span className="text-gray-400 hover:text-gray-600">←</span>
                </Button>
                <Button
                  onClick={goToNextHour}
                  disabled={selectedHourIndex === allPlanetaryHours.length - 1}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  title="Next hour"
                >
                  <span className="text-gray-400 hover:text-gray-600">→</span>
                </Button>
              </div>
              
              {/* Hour ordinal and range */}
              <p className="text-lg md:text-xl text-gray-600 tracking-tight">
                {formatOrdinal(currentHourInfo.hourNumber)} hour ({formatTime(currentHourInfo.start)} - {formatTime(currentHourInfo.end)})
              </p>
              
              {/* Return to now button */}
              <Button
                onClick={resetToCurrentHour}
                variant="link"
                size="sm"
                className="text-sm text-gray-500 hover:text-gray-700 h-auto p-0"
                title="Return to now"
              >
                ↺
              </Button>
            </div>
            
            {/* Current hour progress bar */}
            <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gray-800 transition-all duration-1000 ease-linear"
                style={{ width: `${calculateHourProgress()}%` }}
              />
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl lg:text-4xl text-gray-900 leading-tight tracking-tight mb-3">
            {currentDay} {daySymbol}, Hour {getPlanetWithPreposition(currentHourInfo.planet)} {PLANET_SYMBOLS[currentHourInfo.planet]}
          </h1>
          <div className="flex items-center justify-center gap-1">
            <Popover open={isLocationPickerOpen} onOpenChange={setIsLocationPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-auto p-0.5 hover:bg-gray-100 self-start ${geolocationError ? 'text-orange-500' : ''}`}
                  title={geolocationError ? `Location error: ${geolocationError}` : "Change location"}
                >
                  <MapPinIcon className={`h-4 w-4 ${geolocationError ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'}`} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-3" align="center">
                <div className="flex items-center gap-3">
                  {/* Detection button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={retryGeolocation}
                    disabled={isDetectingLocation}
                    className="h-9 w-9 p-0"
                    title="Detect my current location"
                  >
                    <MapPinIcon className={`h-5 w-5 ${isDetectingLocation ? 'animate-pulse' : ''}`} />
                  </Button>
                  
                  <span className="text-sm text-gray-500">or</span>
                  
                  {/* Location input */}
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="Enter a city..."
                      value={locationInput}
                      onChange={(e) => handleLocationInputChange(e.target.value)}
                      onKeyDown={handleLocationInputKeyDown}
                      disabled={isSearchingLocation}
                      className="w-full h-9 text-sm"
                      autoComplete="off"
                    />
                    
                    {/* Indicador de carregamento */}
                    {isLoadingSuggestions && (
                      <div className="absolute right-2 top-2 text-gray-400">
                        <span className="text-xs">🔍</span>
                      </div>
                    )}
                    
                    {/* Lista de sugestões */}
                    {showSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {locationSuggestions.map((suggestion, index) => {
                          const city = suggestion.address.city || 
                                      suggestion.address.town || 
                                      suggestion.address.village || 
                                      suggestion.address.municipality ||
                                      suggestion.display_name.split(',')[0].trim()
                          const state = suggestion.address.state || ''
                          const country = suggestion.address.country || ''
                          const displayText = `${city}${state ? `, ${state}` : ''}${country ? `, ${country}` : ''}`
                          
                          return (
                            <button
                              key={index}
                              type="button"
                              className={`w-full px-3 py-2 text-left focus:outline-none first:rounded-t-md last:rounded-b-md ${
                                index === selectedSuggestionIndex 
                                  ? 'bg-blue-100 text-blue-900' 
                                  : 'hover:bg-gray-100 focus:bg-gray-100'
                              }`}
                              onClick={() => selectLocationSuggestion(suggestion)}
                              onMouseEnter={() => setSelectedSuggestionIndex(index)}
                            >
                              <div className={`text-sm font-medium ${
                                index === selectedSuggestionIndex ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                                {displayText}
                              </div>
                              <div className={`text-xs truncate ${
                                index === selectedSuggestionIndex ? 'text-blue-700' : 'text-gray-500'
                              }`}>
                                {suggestion.display_name}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                    
                    {/* Message when no suggestions */}
                    {showSuggestions && locationSuggestions.length === 0 && !isLoadingSuggestions && locationInput.length >= 3 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                        <p className="text-sm text-gray-500">No city found</p>
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex flex-col items-center gap-1">
              <p className="text-base md:text-lg text-gray-600 tracking-tight">{getFormattedLocation()}</p>
              {geolocationError && (
                <p className="text-xs text-orange-600 max-w-md text-center">{geolocationError}</p>
              )}
            </div>
          </div>
          
            {/* Manuscript recommendations */}
            {renderRecommendations()}
          </div>
        </div>
      </div>
    </div>
  )
}