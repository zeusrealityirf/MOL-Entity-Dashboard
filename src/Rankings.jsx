export default function Rankings({ title, rows }) {
  return (
    <div>
      <h3>{title}</h3>
      {rows.length ? (
        <ol>
          {rows.slice(0, 10).map(([name, count]) => (
            <li key={name}>
              <span>{name}</span>
              <b>{count}</b>
            </li>
          ))}
        </ol>
      ) : (
        <p>No qualifying records.</p>
      )}
    </div>
  );
}
