import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from 'frontend'

export function Leaderboard() {
  const rows = [
    ['1', 'xQc', '142', '$12,400'],
    ['2', 'Shroud', '128', '$9,800'],
    ['3', 'Ninja', '119', '$7,250'],
    ['4', 'TenZ', '103', '$5,100'],
  ]
  return (
    <div style={{ padding: 20 }}>
      <Table>
        <TableCaption>Top earners — Season 7</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>Wins</TableHead>
            <TableHead>Winnings</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r[0]}>
              <TableCell>{r[0]}</TableCell>
              <TableCell>{r[1]}</TableCell>
              <TableCell>{r[2]}</TableCell>
              <TableCell>{r[3]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
