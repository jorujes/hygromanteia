"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { CalendarIcon, MapPinIcon } from "lucide-react"

interface Location {
  latitude: number
  longitude: number
  city?: string
  state?: string
}

interface PlanetaryHourInfo {
  start: Date
  end: Date
  planet: string
  hourNumber: number
}

interface SunriseSunsetData {
  sunrise: string
  sunset: string
  solar_noon: string
  day_length: number
  civil_twilight_begin: string
  civil_twilight_end: string
  nautical_twilight_begin: string
  nautical_twilight_end: string
  astronomical_twilight_begin: string
  astronomical_twilight_end: string
  status: string
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
  const [sunriseSunsetData, setSunriseSunsetData] = useState<{ sunrise: Date; sunset: Date } | null>(null)
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

  // Função para usar localização padrão
  const useDefaultLocation = useCallback(() => {
    setLocation({
      latitude: -23.5505,
      longitude: -46.6333,
      city: "São Paulo",
      state: "SP",
    })
  }, [])

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

  // Detectar localização e cidade
  useEffect(() => {
    const detectLocation = async () => {
      // Verificar se geolocalização está disponível
      if (!navigator.geolocation) {
        console.log("Geolocalização não suportada pelo navegador")
        setIsGeolocationAvailable(false)
        useDefaultLocation()
        return
      }

      // Configurações para geolocalização
      const options = {
        enableHighAccuracy: false, // Usar GPS menos preciso mas mais rápido
        timeout: 10000, // 10 segundos de timeout
        maximumAge: 300000, // Cache por 5 minutos
      }

      const successCallback = async (position: GeolocationPosition) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        try {
          // Usar API de geocoding reverso para obter cidade
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`,
          )

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data = await response.json()

          setLocation({
            latitude: lat,
            longitude: lng,
            city: data.city || data.locality || "Cidade detectada",
            state: data.principalSubdivision || "",
          })
          setGeolocationError(null) // Limpar qualquer erro anterior
        } catch (error) {
          console.log("Erro ao obter nome da cidade, usando coordenadas:", error)
          setLocation({
            latitude: lat,
            longitude: lng,
            city: "Localização detectada",
            state: "",
          })
          setGeolocationError("Erro ao obter nome da cidade.")
        }
      }

      const errorCallback = (error: GeolocationPositionError) => {
        console.log("Erro na geolocalização:", error.message)
        setGeolocationError(error.message)
        useDefaultLocation()
      }

      try {
        // Tentar obter localização
        navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options)
      } catch (error) {
        console.log("Erro geral na detecção de localização:", error)
        setGeolocationError("Erro ao obter localização.")
        useDefaultLocation()
      }
    }

    detectLocation()
  }, [useDefaultLocation])

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

  // Obter horários de nascer e pôr do sol
  useEffect(() => {
    const fetchSunriseSunset = async () => {
      if (!location) return

      try {
        const today = new Date()
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

        console.log(
          `Buscando dados de nascer/pôr do sol para: ${location.latitude}, ${location.longitude}, data: ${formattedDate}`,
        )

        const response = await fetch(
          `https://api.sunrise-sunset.org/json?lat=${location.latitude}&lng=${location.longitude}&date=${formattedDate}&formatted=0`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          },
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log("Resposta da API:", data)

        if (data.results) {
          const sunriseUTC = new Date(data.results.sunrise)
          const sunsetUTC = new Date(data.results.sunset)

          console.log("Nascer do sol UTC:", sunriseUTC.toISOString())
          console.log("Pôr do sol UTC:", sunsetUTC.toISOString())

          // Converter para horário local
          const sunriseLocal = new Date(sunriseUTC)
          const sunsetLocal = new Date(sunsetUTC)

          console.log("Nascer do sol local:", sunriseLocal.toLocaleTimeString())
          console.log("Pôr do sol local:", sunsetLocal.toLocaleTimeString())

          setSunriseSunsetData({ sunrise: sunriseLocal, sunset: sunsetLocal })
          setApiError(null)
        } else {
          throw new Error("API retornou dados inválidos")
        }
      } catch (error) {
        console.log("Erro ao obter horários de nascer/pôr do sol:", error)
        setApiError(`${error}`)

        // Usar cálculo aproximado baseado na latitude
        const approximateData = calculateApproximateSunriseSunset(location.latitude)
        console.log("Usando horários aproximados:", approximateData)
        setSunriseSunsetData(approximateData)
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
  const calculatePlanetaryHours = (date: Date): PlanetaryHourInfo[] => {
    if (!sunriseSunsetData) return []

    const { sunrise, sunset } = sunriseSunsetData

    // Ajustar para o dia atual
    const todaySunrise = new Date(sunrise)
    todaySunrise.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())

    const todaySunset = new Date(sunset)
    todaySunset.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())

    // Se já passou do pôr do sol, calcular para o próximo ciclo
    const isNight = date > todaySunset || date < todaySunrise

    const dayDuration = todaySunset.getTime() - todaySunrise.getTime()
    const nightDuration = 24 * 60 * 60 * 1000 - dayDuration

    const dayHourDuration = dayDuration / 12 // 12 horas planetárias do dia
    const nightHourDuration = nightDuration / 12 // 12 horas planetárias da noite

    const hours: PlanetaryHourInfo[] = []
    const dayOfWeek = date.getDay()

    // Obter o índice do planeta regente do dia
    const firstPlanetIndex = DAY_TO_PLANET_INDEX[dayOfWeek]

    // Horas do dia (1-12)
    for (let i = 0; i < 12; i++) {
      const start = new Date(todaySunrise.getTime() + i * dayHourDuration)
      const end = new Date(todaySunrise.getTime() + (i + 1) * dayHourDuration)
      const planetIndex = (firstPlanetIndex + i) % 7

      hours.push({
        start,
        end,
        planet: PLANETS[planetIndex],
        hourNumber: i + 1,
      })
    }

    // Horas da noite (13-24)
    for (let i = 0; i < 12; i++) {
      const start = new Date(todaySunset.getTime() + i * nightHourDuration)
      const end = new Date(todaySunset.getTime() + (i + 1) * nightHourDuration)
      const planetIndex = (firstPlanetIndex + 12 + i) % 7

      hours.push({
        start,
        end,
        planet: PLANETS[planetIndex],
        hourNumber: i + 13,
      })
    }

    return hours
  }

  // Encontrar hora planetária atual
  useEffect(() => {
    if (location && sunriseSunsetData) {
      // Usar a data selecionada, mas com a hora atual do dia para comparações
      const dateToUse = new Date(selectedDate)
      dateToUse.setHours(currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds())
      
      const planetaryHours = calculatePlanetaryHours(dateToUse)
      setAllPlanetaryHours(planetaryHours)

      // Encontrar a hora planetária atual
      let currentHour = null
      let currentHourIndex = -1
      for (let i = 0; i < planetaryHours.length; i++) {
        const hour = planetaryHours[i]
        if (currentTime >= hour.start && currentTime < hour.end) {
          currentHour = hour
          currentHourIndex = i
          break
        }
      }

      // Verificar se estamos vendo a data de hoje
      const today = new Date()
      const isViewingToday = selectedDate.toDateString() === today.toDateString()

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

    // Se temos estado, mostrar no formato "Cidade - Estado"
    if (state) {
      return `${city} - ${state}`
    }

    // Se não temos estado, mostrar apenas a cidade
    return city
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
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

  const resetToCurrentHour = () => {
    // Sempre voltar para hoje e hora atual
    setSelectedDate(new Date())
    setIsManuallyNavigating(false)
    setSelectedHourIndex(null)
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setIsDatePickerOpen(false)
      // Se não é hoje, permitir navegação livre, caso contrário, mostrar hora atual
      const today = new Date()
      const isToday = date.toDateString() === today.toDateString()
      
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

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (locationInput.trim()) {
      searchLocationByName(locationInput.trim())
    }
  }

  // Calcular progresso da hora atual (0-100%)
  const calculateHourProgress = (): number => {
    if (!currentHourInfo) return 0
    
    const now = currentTime.getTime()
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
    ].filter(rec => rec.text && rec.text !== "(Missing)")

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
                  className="h-auto p-0.5 hover:bg-gray-100 self-start"
                  title="Alterar localização"
                >
                  <MapPinIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="center">
                <form onSubmit={handleLocationSubmit} className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Digite o nome da cidade:
                    </label>
                    <Input
                      type="text"
                      placeholder="Ex: Rio de Janeiro, London, Paris..."
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      disabled={isSearchingLocation}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!locationInput.trim() || isSearchingLocation}
                      className="flex-1"
                    >
                      {isSearchingLocation ? "Buscando..." : "Buscar"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsLocationPickerOpen(false)
                        setLocationInput("")
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </PopoverContent>
            </Popover>
            <p className="text-base md:text-lg text-gray-600 tracking-tight">{getFormattedLocation()}</p>
          </div>
          
          {/* Recomendações dos manuscritos */}
          {renderRecommendations()}
        </div>
      </div>
    </div>
  )
}
