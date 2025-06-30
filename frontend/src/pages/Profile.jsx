import React, { useEffect } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Particles from "../assets/Particles";
import GooeyNav from "../assets/GoevyNav";

const API_URL = import.meta.env.VITE_BACKEND_URL;

const Profile = () => {

  const userName = localStorage.getItem("name");
  const email = localStorage.getItem("email");

  const [userData, setUserData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const response = await axios.get(`${API_URL}api/profile/${email}`);
      setUserData(response.data);
    }
    fetchData();
  }, []);

  const totalGames = userData.matchesPlayed;
  const winPercentage =
    totalGames > 0 ? (userData.matchesWon / totalGames) * 100 : 0;
  const lossPercentage =
    totalGames > 0 ? (userData.matchesLost / totalGames) * 100 : 0;
  const drawPercentage =
    totalGames > 0 ? (userData.matchesDrawn / totalGames) * 100 : 0;

  const pieChartData = [
    {
      name: "Matches Won",
      value: userData.matchesWon,
      percentage: winPercentage,
    },
    {
      name: "Matches Lost",
      value: userData.matchesLost,
      percentage: lossPercentage,
    },
    {
      name: "Matches Drawn",
      value: userData.matchesDrawn,
      percentage: drawPercentage,
    },
  ];



  const COLORS = ["#388E3C", "#D32F2F"];

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-black font-sans text-black-800 text-center">
      <div className="relative  flex flex-col justify-center items-center bg-black font-sans text-black-800 text-center">
        <div className="absolute inset-0 z-0">
          <Particles
            particleColors={["#ffffff", "#ffffff"]}
            particleCount={200}
            particleSpread={10}
            speed={0.1}
            particleBaseSize={100}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
          />
        </div>
        <div className="min-h-screen flex flex-col items-center w-270 justify-center p-4 mt-10 font-inter z-100 opacity-80">
          <h2 className="text-white text-4xl font-extrabold text-center mb-10 tracking-wide">
            User Profile
          </h2>
          <div className="flex flex-col lg:flex-row items-start lg:justify-center gap-8 w-full max-w-6xl">
            {" "}
            {/* Flex container for side-by-side layout */}
            <div className=" bg-opacity-70 backdrop-blur-sm p-8 rounded-xl shadow-2xl w-full lg:w-1/2 ">
              <ProfileRow label="User Name" value={userName} />
              <ProfileRow label="Email" value={email} />
              <ProfileRow
                label="Matches Played"
                value={userData.matchesPlayed}
              />
              <ProfileRow label="Matches Won" value={userData.matchesWon} />
              <ProfileRow label="Matches Lost" value={userData.matchesLost} />
              <ProfileRow label="Matches Drawn" value={userData.matchesDrawn} />
              <ProfileRow
                label="Classical Rating"
                value={userData.classicalRating || 0}
              />
              <ProfileRow
                label="Blitz Rating"
                value={userData.rating || 0}
              />
            </div>
            <div className="flex flex-col w-full lg:w-1/2 gap-8">
              <div className=" bg-opacity-70 backdrop-blur-sm p-8 rounded-xl shadow-2xl ">
                <h3 className="text-white text-2xl font-bold text-center mb-4">
                  Win/Loss Ratio
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      label={({
                        cx,
                        cy,
                        midAngle,
                        outerRadius,
                        percent,
                        name,
                        percentage,
                      }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 25;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                        return (
                          <text
                            x={x}
                            y={y}
                            fill="white"
                            textAnchor={x > cx ? "start" : "end"}
                            dominantBaseline="central"
                            className="text-sm font-semibold"
                          >
                            {`${name}: ${percentage.toFixed(1)}%`}
                          </text>
                        );
                      }}
                      labelLine={false}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${props.payload.percentage.toFixed(1)}%`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center mt-4 text-white">
                  <div className="flex items-center mx-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-[#388E3C] mr-2"></span>{" "}
                    Matches Won
                  </div>
                  <div className="flex items-center mx-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-[#D32F2F] mr-2"></span>{" "}
                    Matches Lost
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-700 last:border-b-0">
    <span className="font-semibold text-gray-300 text-lg">{label}:</span>
    <span className="text-white text-lg font-medium">{value}</span>
  </div>
);

export default Profile;
