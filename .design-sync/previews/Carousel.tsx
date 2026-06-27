import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from 'frontend'

export function Default() {
  const games = ['Warzone', 'Fortnite', 'EA FC 26', 'Rocket League', 'Valorant']
  return (
    <div style={{ padding: '24px 56px', maxWidth: 460 }}>
      <Carousel>
        <CarouselContent>
          {games.map((g, i) => (
            <CarouselItem key={i} style={{ flexBasis: '50%' }}>
              <div
                style={{
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: 12,
                  padding: '44px 0',
                  textAlign: 'center',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800,
                  fontSize: 22,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                {g}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  )
}
