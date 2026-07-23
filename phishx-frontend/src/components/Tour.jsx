"use client";
import React, { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./Tour.css";

export default function Tour({ run, steps }) {
  useEffect(() => {
    if (!run) return;

    const validSteps = steps.filter(step => {
      const el = document.querySelector(step.target);
      return el && window.getComputedStyle(el).display !== 'none';
    }).map(step => ({
      element: step.target,
      popover: {
        title: step.title || 'PhishX Tour',
        description: step.content,
        side: "bottom",
        align: "start"
      },
      onHighlightStarted: (el, driverStep, options) => {
        // Force scroll to ensure element is always visible (handles down to scanner, up to login)
        if (el && window.innerWidth > 768) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }

        // Auto-open mobile sidebar for navigation steps
        if (window.innerWidth <= 768) {
          const isNavStep = step.target === '.nav-links' || step.target === '#nav-cyberpulse' || step.target === '.auth-group';
          const toggleBtn = document.querySelector('.navbar-toggle');
          const menuWrapper = document.querySelector('.nav-menu-wrapper');
          
          if (isNavStep && toggleBtn && menuWrapper && !menuWrapper.classList.contains('open')) {
            toggleBtn.click();
          } else if (!isNavStep && toggleBtn && menuWrapper && menuWrapper.classList.contains('open')) {
            toggleBtn.click();
          }
          
          // Also explicitly scroll on mobile if it's the scanner step
          if (step.target === '#scan' && el) {
            setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
          }
        }
      }
    }));

    if (validSteps.length === 0) {
      console.warn("No valid tour steps found for current screen size");
      return;
    }

    const driverObj = driver({
      showProgress: true,
      animate: true,
      popoverClass: 'phishx-driver-theme',
      steps: validSteps,
      onDestroyStarted: () => {
        driverObj.destroy();
        localStorage.setItem('phishx_has_seen_tour_v10', 'true');
      },
    });

    driverObj.drive();

  }, [run, steps]);

  return null;
}
