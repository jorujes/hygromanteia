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

const DAYS_PT = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]
const DAYS_CLASSICAL = [
  "Dia do Sol",
  "Dia da Lua", 
  "Dia de Marte",
  "Dia de Mercúrio",
  "Dia de Júpiter",
  "Dia de Vênus",
  "Dia de Saturno",
]
// Ordem caldéica dos planetas
const PLANETS = ["Sol", "Vênus", "Mercúrio", "Lua", "Saturno", "Júpiter", "Marte"]

// Símbolos astrológicos correspondentes
const PLANET_SYMBOLS: Record<string, string> = {
  Sol: "☉",
  Lua: "☾",
  Mercúrio: "☿",
  Vênus: "♀",
  Marte: "♂",
  Júpiter: "♃",
  Saturno: "♄",
}

// Preposições corretas para cada planeta
const PLANET_PREPOSITIONS: Record<string, string> = {
  Sol: "do Sol",
  Lua: "da Lua",
  Mercúrio: "de Mercúrio",
  Vênus: "de Vênus",
  Marte: "de Marte",
  Júpiter: "de Júpiter",
  Saturno: "de Saturno",
}

// Mapeamento correto: dia da semana -> índice do planeta regente no array PLANETS
const DAY_TO_PLANET_INDEX = [
  0, // Domingo = Sol (índice 0)
  3, // Segunda = Lua (índice 3)
  6, // Terça = Marte (índice 6)
  2, // Quarta = Mercúrio (índice 2)
  5, // Quinta = Júpiter (índice 5)
  1, // Sexta = Vênus (índice 1)
  4, // Sábado = Saturno (índice 4)
]

const MONTHS_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
]

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

  // Carregar dados das horas planetárias
  useEffect(() => {
    const loadPlanetaryData = async () => {
      try {
        const response = await fetch('/data/planetary_hours.json')
        const data: PlanetaryHourData[] = await response.json()
        setPlanetaryHourData(data)
      } catch (error) {
        console.error('Erro ao carregar dados das horas planetárias:', error)
      }
    }

    loadPlanetaryData()
  }, [])

  // Função para verificar estado da permissão de geolocalização
  const checkGeolocationPermission = useCallback(async () => {
    if (!navigator.permissions) {
      return 'unknown'
    }
    
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' })
      return result.state // 'granted', 'denied', 'prompt'
    } catch (error) {
      console.log("Erro ao verificar permissão de geolocalização:", error)
      return 'unknown'
    }
  }, [])

  // Função para usar localização padrão
  const useDefaultLocation = useCallback(() => {
    const newTimezone = "America/Sao_Paulo"
    
    const newLocation: Location = {
      latitude: -23.5505,
      longitude: -46.6333,
      city: "São Paulo",
      state: "SP",
      country: "Brasil",
      timezone: newTimezone,
    }

    // Verificar se precisamos ajustar a data para o "hoje" da nova localização
    const currentSelectedDate = selectedDate
    const todayInBrowser = new Date()
    const todayInNewLocation = DateTime.now().setZone(newTimezone).toJSDate()
    
    // Se estávamos vendo o "hoje" do browser e não estamos navegando manualmente
    const wasViewingToday = currentSelectedDate.toDateString() === todayInBrowser.toDateString()
    
    if (wasViewingToday && !isManuallyNavigating) {
      // Verificar se o "hoje" na nova localização é diferente
      const newLocationDateString = todayInNewLocation.toDateString()
      const currentDateString = currentSelectedDate.toDateString()
      
      if (newLocationDateString !== currentDateString) {
        // Atualizar para o "hoje" da nova localização
        setSelectedDate(todayInNewLocation)
        setIsManuallyNavigating(false) // Manter no modo automático
        setSelectedHourIndex(null) // Reset para encontrar a hora atual
      }
    }

    setLocation(newLocation)
  }, [selectedDate, isManuallyNavigating])

  // Função para solicitar geolocalização de forma otimizada
  const requestGeolocation = useCallback(async () => {
    setIsDetectingLocation(true)
    
    // Verificar se geolocalização está disponível
    if (!navigator.geolocation) {
      console.log("Geolocalização não suportada pelo navegador")
      setIsGeolocationAvailable(false)
      setGeolocationError("Geolocalização não suportada por este navegador.")
      setIsDetectingLocation(false)
      useDefaultLocation()
      return
    }

    // Verificar estado da permissão primeiro
    const permissionState = await checkGeolocationPermission()
    console.log("Estado da permissão de geolocalização:", permissionState)

         if (permissionState === 'denied') {
       setGeolocationError("Permissão de geolocalização negada. Use o ícone de localização para inserir sua cidade manualmente.")
       setIsDetectingLocation(false)
       useDefaultLocation()
       return
     }

    // Configurações otimizadas para diferentes cenários
    const options = {
      enableHighAccuracy: true, // Tentar obter localização mais precisa primeiro
      timeout: 8000, // Timeout mais conservador (8 segundos)
      maximumAge: 300000, // Cache por 5 minutos
    }

    const successCallback = async (position: GeolocationPosition) => {
      const lat = position.coords.latitude
      const lng = position.coords.longitude

      console.log("Geolocalização obtida com sucesso:", { lat, lng, accuracy: position.coords.accuracy })

      try {
        // Usar API de geocoding reverso para obter cidade
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`,
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        const newTimezone = tzLookup(lat, lng)
        
        const newLocation: Location = {
          latitude: lat,
          longitude: lng,
          city: data.city || data.locality || "Cidade detectada",
          state: data.principalSubdivision || "",
          country: data.countryName || "",
          timezone: newTimezone,
        }

        // Verificar se precisamos ajustar a data para o "hoje" da nova localização
        const currentSelectedDate = selectedDate
        const todayInBrowser = new Date()
        const todayInNewLocation = DateTime.now().setZone(newTimezone).toJSDate()
        
        // Se estávamos vendo o "hoje" do browser e não estamos navegando manualmente
        const wasViewingToday = currentSelectedDate.toDateString() === todayInBrowser.toDateString()
        
        if (wasViewingToday && !isManuallyNavigating) {
          // Verificar se o "hoje" na nova localização é diferente
          const newLocationDateString = todayInNewLocation.toDateString()
          const currentDateString = currentSelectedDate.toDateString()
          
          if (newLocationDateString !== currentDateString) {
            // Atualizar para o "hoje" da nova localização
            setSelectedDate(todayInNewLocation)
            setIsManuallyNavigating(false) // Manter no modo automático
            setSelectedHourIndex(null) // Reset para encontrar a hora atual
          }
        }

        setLocation(newLocation)
                 setGeolocationError(null) // Limpar qualquer erro anterior
         setIsDetectingLocation(false)
      } catch (error) {
        console.log("Erro ao obter nome da cidade, usando coordenadas:", error)
        setLocation({
          latitude: lat,
          longitude: lng,
          city: "Localização detectada",
          state: "",
          country: "Brasil",
          timezone: "America/Sao_Paulo",
        })
                   setGeolocationError("Localização detectada, mas não foi possível obter o nome da cidade.")
           setIsDetectingLocation(false)
         }
       }

    const errorCallback = (error: GeolocationPositionError) => {
      console.log("Erro na geolocalização:", error.message, "Código:", error.code)
      
      let errorMessage = ""
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Permissão de geolocalização negada. Use o ícone de localização para inserir sua cidade."
          break
        case error.POSITION_UNAVAILABLE:
          // Não mostrar erro para posição não disponível, usar silenciosamente o padrão
          errorMessage = ""
          break
        case error.TIMEOUT:
          // Não mostrar erro para timeout, usar silenciosamente o padrão
          errorMessage = ""
          break
        default:
          // Não mostrar erro para outros casos, usar silenciosamente o padrão
          errorMessage = ""
          break
      }
      
      // Só definir erro se houver mensagem (apenas para permissão negada)
      if (errorMessage) {
        setGeolocationError(errorMessage)
      } else {
        setGeolocationError(null)
      }
      setIsDetectingLocation(false)
      useDefaultLocation()
    }

    try {
      // Tentar obter localização com alta precisão primeiro
      navigator.geolocation.getCurrentPosition(successCallback, (error) => {
        // Se falhar com alta precisão, tentar com baixa precisão
        if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
          console.log("Tentando com baixa precisão...")
          const fallbackOptions = {
            enableHighAccuracy: false,
            timeout: 6000, // Timeout mais curto para fallback
            maximumAge: 300000,
          }
          
          navigator.geolocation.getCurrentPosition(successCallback, errorCallback, fallbackOptions)
        } else {
          errorCallback(error)
        }
      }, options)
         } catch (error) {
       console.log("Erro geral na detecção de localização:", error)
       setGeolocationError("Erro ao acessar a geolocalização.")
       setIsDetectingLocation(false)
       useDefaultLocation()
     }
  }, [useDefaultLocation, checkGeolocationPermission, selectedDate, isManuallyNavigating])

  // Detectar localização e cidade - agora com delay para melhor UX
  useEffect(() => {
    const detectLocationWithDelay = async () => {
      // Aguardar um pouco para a página carregar completamente
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verificar se é o primeiro carregamento
      const hasLocationStored = localStorage.getItem('hygromanteia-location-preference')
      
      if (hasLocationStored === 'default') {
        // Se o usuário já escolheu usar localização padrão, não perguntar novamente
        useDefaultLocation()
        return
      }

      if (hasLocationStored === 'auto') {
        // Se o usuário já permitiu auto-detecção, tentar novamente
        await requestGeolocation()
        return
      }

      // Primeira vez: tentar detectar automaticamente
      await requestGeolocation()
    }

    detectLocationWithDelay()
  }, [requestGeolocation, useDefaultLocation])

  // Função para buscar localização por nome
  const searchLocationByName = useCallback(async (locationName: string) => {
    if (!locationName.trim()) return

    setIsSearchingLocation(true)
    
    try {
      // Usar a API OpenStreetMap Nominatim que é mais confiável
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
        
        setLocation({
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          city: displayParts[0] || locationName,
          state: result.address?.state || displayParts[1] || "",
          country: result.address?.country || "Brasil",
          timezone: tzLookup(parseFloat(result.lat), parseFloat(result.lon)),
        })
        setIsLocationPickerOpen(false)
        setLocationInput("")
      } else {
        alert("Localização não encontrada. Tente novamente com outro nome ou seja mais específico (ex: 'Rio de Janeiro, Brasil').")
      }
    } catch (error) {
      console.error("Erro ao buscar localização:", error)
      alert("Erro ao buscar localização. Verifique sua conexão e tente novamente.")
    } finally {
      setIsSearchingLocation(false)
    }
  }, [])

  // Calcular horários aproximados de nascer e pôr do sol baseados na latitude
  const calculateApproximateSunriseSunset = (latitude: number): { sunrise: Date; sunset: Date } => {
    const today = new Date()
    const month = today.getMonth()

    // Ajustes sazonais aproximados (minutos antes/depois de 6h/18h)
    const seasonalAdjustment = [
      { sr: -60, ss: 60 }, // Janeiro
      { sr: -40, ss: 40 }, // Fevereiro
      { sr: -20, ss: 20 }, // Março
      { sr: 0, ss: 0 }, // Abril
      { sr: 20, ss: -20 }, // Maio
      { sr: 30, ss: -30 }, // Junho
      { sr: 20, ss: -20 }, // Julho
      { sr: 0, ss: 0 }, // Agosto
      { sr: -20, ss: 20 }, // Setembro
      { sr: -40, ss: 40 }, // Outubro
      { sr: -60, ss: 60 }, // Novembro
      { sr: -70, ss: 70 }, // Dezembro
    ]

    // Ajuste baseado na latitude (quanto mais longe do equador, maior a variação sazonal)
    const latitudeAdjustment = (Math.abs(latitude) / 90) * 60 // até 60 minutos de ajuste no extremo

    // Calcular horários base (6h e 18h)
    const sunrise = new Date(today)
    sunrise.setHours(6, 0, 0, 0)

    const sunset = new Date(today)
    sunset.setHours(18, 0, 0, 0)

    // Aplicar ajustes
    const srAdjustment = seasonalAdjustment[month].sr * (latitudeAdjustment / 60)
    const ssAdjustment = seasonalAdjustment[month].ss * (latitudeAdjustment / 60)

    // No hemisfério sul, inverter os ajustes sazonais
    const finalSrAdjustment = latitude < 0 ? -srAdjustment : srAdjustment
    const finalSsAdjustment = latitude < 0 ? -ssAdjustment : ssAdjustment

    sunrise.setMinutes(sunrise.getMinutes() + finalSrAdjustment)
    sunset.setMinutes(sunset.getMinutes() + finalSsAdjustment)

    return { sunrise, sunset }
  }

  // Obter horários de nascer e pôr do sol com correção de fuso horário
  useEffect(() => {
    const fetchSunriseSunset = async () => {
      if (!location) return

      try {
        const today = DateTime.now().setZone(location.timezone)
        const formattedDate = today.toFormat("yyyy-MM-dd")

        console.log(
          `Buscando dados de nascer/pôr do sol para: ${location.latitude}, ${location.longitude}, data: ${formattedDate} no fuso ${location.timezone}`
        )

        // Buscar dados de nascer/pôr do sol
        const response = await fetch(
          `https://api.sunrise-sunset.org/json?lat=${location.latitude}&lng=${location.longitude}&date=${formattedDate}&formatted=0`
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log("Resposta da API sunrise-sunset:", data)

        if (data.results && data.status === "OK") {
          // As strings da API são sempre em UTC. O Luxon fará a mágica.
          const sunriseUTC = DateTime.fromISO(data.results.sunrise, {
            zone: "utc",
          })
          const sunsetUTC = DateTime.fromISO(data.results.sunset, {
            zone: "utc",
          })

          // Converter para o fuso horário correto da localização
          const sunriseLocal = sunriseUTC.setZone(location.timezone)
          const sunsetLocal = sunsetUTC.setZone(location.timezone)

          console.log(
            "Nascer do sol (horário local da região):",
            sunriseLocal.toFormat("HH:mm:ss")
          )
          console.log(
            "Pôr do sol (horário local da região):",
            sunsetLocal.toFormat("HH:mm:ss")
          )

          setSunriseSunsetData({ sunrise: sunriseLocal, sunset: sunsetLocal })
          setApiError(null)
        } else {
          throw new Error("API retornou dados inválidos ou erro de status.")
        }
      } catch (error) {
        console.log("Erro ao obter horários de nascer/pôr do sol:", error)
        setApiError(`${error}`)

        // O fallback para cálculo aproximado pode ser mantido se desejado,
        // mas a API é geralmente confiável. Por enquanto, apenas logamos o erro.
        setSunriseSunsetData(null) // Limpar dados antigos
      }
    }

    if (location) {
      fetchSunriseSunset()
    }
  }, [location])

  // Atualizar tempo atual
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Calcular horas planetárias baseadas no horário real do nascer/pôr do sol
  const calculatePlanetaryHours = useCallback((date: Date): PlanetaryHourInfo[] => {
    if (!sunriseSunsetData || !location) return []

    const { sunrise, sunset } = sunriseSunsetData
    const dateToCalculate = DateTime.fromJSDate(date, {
      zone: location.timezone,
    })

    // Assegurar que as datas de nascer e por do sol correspondem ao dia selecionado
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
    const dayOfWeek = dateToCalculate.weekday % 7 // Luxon weekday: 1=Seg, 7=Dom. Ajuste para 0=Dom.

    // Obter o índice do planeta regente do dia
    const firstPlanetIndex = DAY_TO_PLANET_INDEX[dayOfWeek]

    // Horas do dia (1-12)
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
        country: location.country || "Brasil",
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,
      })
    }

    // Horas da noite (13-24)
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
        country: location.country || "Brasil",
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
    const dayIndex = selectedDate.getDay()
    return DAYS_CLASSICAL[dayIndex]
  }

  const getFormattedDate = (): string => {
    const dayOfWeek = DAYS_PT[selectedDate.getDay()]
    const day = selectedDate.getDate()
    const month = MONTHS_PT[selectedDate.getMonth()]
    const year = selectedDate.getFullYear()

    return `${dayOfWeek}, ${day} de ${month} de ${year}`
  }

  const getFormattedLocation = (): string => {
    if (!location) return "Localização não detectada"

    const city = location.city || "Cidade não identificada"
    const state = location.state || ""
    const country = location.country || "Brasil"

    // Se temos estado, mostrar no formato "Cidade - Estado"
    if (state) {
      return `${city} - ${state} - ${country}`
    }

    // Se não temos estado, mostrar apenas a cidade
    return city
  }

  const formatTime = (date: Date): string => {
    if (!location?.timezone) return "--:--"
    return DateTime.fromJSDate(date)
      .setZone(location.timezone)
      .toFormat("HH:mm")
  }

  // Ex.: 1ª, 2ª, 10ª hora (forma feminina porque "hora")
  const formatOrdinal = (n: number): string => `${n}ª`

  // Função para obter preposição correta do planeta
  const getPlanetWithPreposition = (planet: string): string => {
    return PLANET_PREPOSITIONS[planet] || `de ${planet}`
  }

  // Função para buscar recomendações da hora atual
  const getHourRecommendations = (dayName: string, hourNumber: number): PlanetaryHourData | null => {
    if (planetaryHourData.length === 0) return null
    
    const hourKey = `${hourNumber}ª`
    
    return planetaryHourData.find(item => 
      item.Dia === dayName && item.Hora === hourKey
    ) || null
  }

  // Funções para navegar entre as horas
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
        if (currentTimeJS >= hour.start && currentTimeJS < hour.end) {
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

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setIsDatePickerOpen(false)
      // Se não é hoje, permitir navegação livre, caso contrário, mostrar hora atual
      const todayInLocation = location?.timezone 
        ? DateTime.now().setZone(location.timezone).toJSDate()
        : new Date()
      const isToday = date.toDateString() === todayInLocation.toDateString()
      
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
    // Salvar preferência do usuário para auto-detecção
    localStorage.setItem('hygromanteia-location-preference', 'auto')
    
    // Limpar erro anterior
    setGeolocationError(null)
    
    // Fechar popover
    setIsLocationPickerOpen(false)
    
    // Tentar detectar localização
    await requestGeolocation()
  }, [requestGeolocation])

  // Função para usar localização padrão permanentemente
  const useDefaultPermanently = useCallback(() => {
    localStorage.setItem('hygromanteia-location-preference', 'default')
    useDefaultLocation()
  }, [useDefaultLocation])

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
    // Extrair nome da cidade de forma mais inteligente
    const city = suggestion.address.city || 
                 suggestion.address.town || 
                 suggestion.address.village || 
                 suggestion.address.municipality ||
                 // Pegar a primeira parte do display_name como fallback
                 suggestion.display_name.split(',')[0].trim()
                 
    const state = suggestion.address.state || ''
    const country = suggestion.address.country || ''

    console.log('Selecionando localização:', { 
      city, 
      state, 
      country, 
      fullAddress: suggestion.address,
      displayName: suggestion.display_name 
    })

    const newTimezone = tzLookup(parseFloat(suggestion.lat), parseFloat(suggestion.lon))
    
    const newLocation: Location = {
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      city: city,
      state: state || country,
      country: country,
      timezone: newTimezone,
    }

    // Verificar se precisamos ajustar a data para o "hoje" da nova localização
    const currentSelectedDate = selectedDate
    const todayInBrowser = new Date()
    const todayInNewLocation = DateTime.now().setZone(newTimezone).toJSDate()
    
    // Se estávamos vendo o "hoje" do browser e não estamos navegando manualmente
    const wasViewingToday = currentSelectedDate.toDateString() === todayInBrowser.toDateString()
    
    if (wasViewingToday && !isManuallyNavigating) {
      // Verificar se o "hoje" na nova localização é diferente
      const newLocationDateString = todayInNewLocation.toDateString()
      const currentDateString = currentSelectedDate.toDateString()
      
      if (newLocationDateString !== currentDateString) {
        // Atualizar para o "hoje" da nova localização
        setSelectedDate(todayInNewLocation)
        setIsManuallyNavigating(false) // Manter no modo automático
        setSelectedHourIndex(null) // Reset para encontrar a hora atual
      }
    }

    setLocation(newLocation)
    setLocationInput("")
    setLocationSuggestions([])
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)
    setIsLocationPickerOpen(false)
  }, [selectedDate, isManuallyNavigating])

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

  // Renderizar recomendações dos manuscritos
  const renderRecommendations = () => {
    if (!currentHourRecommendations) return null

    const recommendations = [
      { name: "Harleianus", text: currentHourRecommendations.Harleianus },
      { name: "Monacensis", text: currentHourRecommendations.Monacensis },
      { name: "Gennadianus", text: currentHourRecommendations.Gennadianus }
    ]

    if (recommendations.length === 0) return null

    return (
      <div className="mt-12 max-w-5xl mx-auto">
        <h3 className="text-xl font-medium text-gray-800 mb-6 text-center">Recomendações dos Manuscritos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
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
          <p className="text-2xl text-gray-800 font-normal">Calculando...</p>
          {geolocationError && <p className="text-sm text-gray-500 mt-2">{geolocationError}</p>}
          {apiError && <p className="text-sm text-gray-500 mt-2">Usando horários aproximados</p>}
          {!isGeolocationAvailable && (
            <p className="text-sm text-gray-500 mt-2">Geolocalização não suportada. Usando localização padrão.</p>
          )}
        </div>
      </div>
    )
  }

  const currentDay = getCurrentDay()
  const dayPlanetName = PLANETS[DAY_TO_PLANET_INDEX[selectedDate.getDay()]]
  const daySymbol = PLANET_SYMBOLS[dayPlanetName]

  return (
    <div className="min-h-screen bg-white relative">
      {/* Data no canto superior esquerdo */}
      <div className="absolute top-4 left-4 text-left">
        <div className="flex items-center gap-2">
          <p className="text-sm md:text-base text-gray-600 tracking-tight">{getFormattedDate()}</p>
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 hover:bg-gray-100"
                title="Selecionar data"
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

      {/* Conteúdo principal centralizado */}
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
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
                  title="Hora anterior"
                >
                  <span className="text-gray-400 hover:text-gray-600">←</span>
                </Button>
                <Button
                  onClick={goToNextHour}
                  disabled={selectedHourIndex === allPlanetaryHours.length - 1}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  title="Próxima hora"
                >
                  <span className="text-gray-400 hover:text-gray-600">→</span>
                </Button>
              </div>
              
              {/* Ordinal e range da hora */}
              <p className="text-lg md:text-xl text-gray-600 tracking-tight">
                {formatOrdinal(currentHourInfo.hourNumber)} hora ({formatTime(currentHourInfo.start)} - {formatTime(currentHourInfo.end)})
              </p>
              
              {/* Botão para voltar ao agora */}
              <Button
                onClick={resetToCurrentHour}
                variant="link"
                size="sm"
                className="text-sm text-gray-500 hover:text-gray-700 h-auto p-0"
                title="Voltar ao agora"
              >
                ↺
              </Button>
            </div>
            
            {/* Barra de progresso da hora atual */}
            <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gray-800 transition-all duration-1000 ease-linear"
                style={{ width: `${calculateHourProgress()}%` }}
              />
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl lg:text-4xl text-gray-900 leading-tight tracking-tight mb-3">
            {currentDay} {daySymbol}, Hora {getPlanetWithPreposition(currentHourInfo.planet)} {PLANET_SYMBOLS[currentHourInfo.planet]}
          </h1>
          <div className="flex items-center justify-center gap-1">
            <Popover open={isLocationPickerOpen} onOpenChange={setIsLocationPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-auto p-0.5 hover:bg-gray-100 self-start ${geolocationError ? 'text-orange-500' : ''}`}
                  title={geolocationError ? `Erro de localização: ${geolocationError}` : "Alterar localização"}
                >
                  <MapPinIcon className={`h-4 w-4 ${geolocationError ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'}`} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-3" align="center">
                <div className="flex items-center gap-3">
                  {/* Botão de detecção */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={retryGeolocation}
                    disabled={isDetectingLocation}
                    className="h-9 w-9 p-0"
                    title="Detectar minha localização atual"
                  >
                    <MapPinIcon className={`h-5 w-5 ${isDetectingLocation ? 'animate-pulse' : ''}`} />
                  </Button>
                  
                  <span className="text-sm text-gray-500">ou</span>
                  
                  {/* Input de localização */}
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="Digite uma cidade..."
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
                    
                    {/* Mensagem quando não há sugestões */}
                    {showSuggestions && locationSuggestions.length === 0 && !isLoadingSuggestions && locationInput.length >= 3 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                        <p className="text-sm text-gray-500">Nenhuma cidade encontrada</p>
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
          
          {/* Recomendações dos manuscritos */}
          {renderRecommendations()}
        </div>
      </div>
    </div>
  )
}